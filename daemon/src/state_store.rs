use crate::error::{DaemonError, Result};
use crate::model::{ControlPlaneState, RuntimeStatus, SyncState};
use chrono::Utc;
use std::collections::HashSet;
use std::path::Path;
use tokio::sync::RwLock;

pub struct StateStore {
    state: RwLock<ControlPlaneState>,
    status: RwLock<RuntimeStatus>,
    state_path: std::path::PathBuf,
}

impl StateStore {
    pub async fn load_or_init(state_path: std::path::PathBuf) -> Result<Self> {
        let state = if Path::new(&state_path).exists() {
            let raw = tokio::fs::read_to_string(&state_path).await?;
            serde_json::from_str::<ControlPlaneState>(&raw)?
        } else {
            if let Some(parent) = state_path.parent() {
                tokio::fs::create_dir_all(parent).await?;
            }
            let initial = ControlPlaneState::initial();
            write_state_file(&state_path, &initial).await?;
            initial
        };

        validate_state(&state)?;

        let status = RuntimeStatus {
            desired_revision: state.revision,
            observed_revision: state.revision,
            sync_state: SyncState::InSync,
            active_config_hash: None,
            last_error: None,
            updated_at: Utc::now(),
        };

        Ok(Self {
            state: RwLock::new(state),
            status: RwLock::new(status),
            state_path,
        })
    }

    pub async fn get_state(&self) -> ControlPlaneState {
        self.state.read().await.clone()
    }

    pub async fn get_status(&self) -> RuntimeStatus {
        self.status.read().await.clone()
    }

    pub async fn put_state(&self, expected_revision: u64, mut draft: ControlPlaneState) -> Result<ControlPlaneState> {
        let mut state_guard = self.state.write().await;
        if state_guard.revision != expected_revision {
            return Err(DaemonError::Conflict(format!(
                "revision mismatch: expected {}, actual {}",
                expected_revision, state_guard.revision
            )));
        }

        if draft.updated_by.trim().is_empty() {
            return Err(DaemonError::InvalidInput("updatedBy must be non-empty".to_owned()));
        }

        draft.schema_version = state_guard.schema_version.clone();
        draft.revision = state_guard.revision + 1;
        draft.updated_at = Utc::now();

        validate_state(&draft)?;
        write_state_file(&self.state_path, &draft).await?;

        *state_guard = draft.clone();

        let mut status_guard = self.status.write().await;
        status_guard.desired_revision = draft.revision;
        status_guard.sync_state = SyncState::PendingApply;
        status_guard.last_error = None;
        status_guard.updated_at = Utc::now();

        Ok(draft)
    }

    pub async fn mark_applying(&self) {
        let mut status_guard = self.status.write().await;
        status_guard.sync_state = SyncState::Applying;
        status_guard.updated_at = Utc::now();
        status_guard.last_error = None;
    }

    pub async fn mark_in_sync(&self, observed_revision: u64, config_hash: String) {
        let mut status_guard = self.status.write().await;
        status_guard.observed_revision = observed_revision;
        status_guard.desired_revision = observed_revision;
        status_guard.sync_state = SyncState::InSync;
        status_guard.active_config_hash = Some(config_hash);
        status_guard.updated_at = Utc::now();
        status_guard.last_error = None;
    }

    pub async fn mark_degraded(&self, error: String) {
        let mut status_guard = self.status.write().await;
        status_guard.sync_state = SyncState::Degraded;
        status_guard.last_error = Some(error);
        status_guard.updated_at = Utc::now();
    }
}

async fn write_state_file(path: &Path, state: &ControlPlaneState) -> Result<()> {
    let tmp_path = path.with_extension("json.tmp");
    let payload = serde_json::to_vec_pretty(state)?;
    tokio::fs::write(&tmp_path, payload).await?;
    tokio::fs::rename(&tmp_path, path).await?;
    Ok(())
}

fn validate_state(state: &ControlPlaneState) -> Result<()> {
    for server in &state.servers {
        if server.id.trim().is_empty() {
            return Err(DaemonError::InvalidInput("server.id must be non-empty".to_owned()));
        }

        let mut listen_set = HashSet::new();
        for listen in &server.listen {
            let key = (listen.port, listen.ssl, listen.http2.unwrap_or(false), listen.default_server.unwrap_or(false));
            if !listen_set.insert(key) {
                return Err(DaemonError::InvalidInput(format!(
                    "duplicate listen tuple in server {}",
                    server.id
                )));
            }
        }

        let mut route_path_set = HashSet::new();
        for route in &server.routes {
            if !route.path.starts_with('/') {
                return Err(DaemonError::InvalidInput(format!(
                    "route.path must start with '/': {}",
                    route.path
                )));
            }
            if !route_path_set.insert(route.path.clone()) {
                return Err(DaemonError::InvalidInput(format!(
                    "duplicate route.path in server {}: {}",
                    server.id, route.path
                )));
            }
        }
    }
    Ok(())
}

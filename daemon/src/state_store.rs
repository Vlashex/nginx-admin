use crate::error::{DaemonError, Result};
use crate::model::{ControlPlaneState, RuntimeStatus, SyncState};
use chrono::Utc;
use std::collections::HashSet;
use std::path::Path;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

pub struct StateStore {
    state: RwLock<ControlPlaneState>,
    status: RwLock<RuntimeStatus>,
    state_path: std::path::PathBuf,
}

impl StateStore {
    pub async fn load_or_init(state_path: std::path::PathBuf) -> Result<Self> {
        info!(state_path = %state_path.display(), "loading state store");
        let state = if Path::new(&state_path).exists() {
            let raw = tokio::fs::read_to_string(&state_path).await?;
            serde_json::from_str::<ControlPlaneState>(&raw)?
        } else {
            if let Some(parent) = state_path.parent() {
                tokio::fs::create_dir_all(parent).await?;
            }
            let initial = ControlPlaneState::initial();
            write_state_file(&state_path, &initial).await?;
            info!(state_path = %state_path.display(), "state initialized");
            initial
        };

        validate_state(&state)?;
        info!(
            revision = state.revision,
            servers = state.servers.len(),
            "state loaded"
        );

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
            warn!(
                expected_revision,
                actual_revision = state_guard.revision,
                "revision conflict"
            );
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
        info!(
            revision = draft.revision,
            updated_by = %draft.updated_by,
            servers = draft.servers.len(),
            "state updated"
        );

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
        debug!("status set to applying");
    }

    pub async fn mark_in_sync(&self, observed_revision: u64, config_hash: String) {
        let mut status_guard = self.status.write().await;
        status_guard.observed_revision = observed_revision;
        status_guard.desired_revision = observed_revision;
        status_guard.sync_state = SyncState::InSync;
        status_guard.active_config_hash = Some(config_hash);
        status_guard.updated_at = Utc::now();
        status_guard.last_error = None;
        info!(revision = observed_revision, "status set to in_sync");
    }

    pub async fn mark_degraded(&self, error: String) {
        let mut status_guard = self.status.write().await;
        status_guard.sync_state = SyncState::Degraded;
        status_guard.last_error = Some(error);
        status_guard.updated_at = Utc::now();
        warn!("status set to degraded");
    }

    pub async fn mark_out_of_sync(&self, details: String) {
        let mut status_guard = self.status.write().await;
        status_guard.sync_state = SyncState::OutOfSync;
        status_guard.last_error = Some(details);
        status_guard.updated_at = Utc::now();
        warn!("status set to out_of_sync");
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
        if let Some(extra_directives) = &server.extra_directives {
            for directive in extra_directives {
                if contains_sensitive_directive(directive) {
                    return Err(DaemonError::InvalidInput(format!(
                        "sensitive directives must not be stored in state.json for server {}",
                        server.id
                    )));
                }
            }
        }

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

            if let Some(headers) = &route.headers {
                for header in headers {
                    if is_sensitive_name(&header.name) {
                        return Err(DaemonError::InvalidInput(format!(
                            "sensitive header values must not be stored in state.json: {}",
                            header.name
                        )));
                    }
                }
            }

            if let crate::model::RouteAction::ProxyPass { target } = &route.action {
                if target_contains_credentials(target) {
                    return Err(DaemonError::InvalidInput(format!(
                        "proxy target must not contain embedded credentials in server {} route {}",
                        server.id, route.id
                    )));
                }
            }
        }
    }
    Ok(())
}

fn is_sensitive_name(value: &str) -> bool {
    let normalized = value.to_ascii_lowercase();
    [
        "token",
        "secret",
        "password",
        "passphrase",
        "private",
        "auth",
        "credential",
        "key",
        "jwt",
        "session",
        "cookie",
    ]
    .iter()
    .any(|needle| normalized.contains(needle))
}

fn target_contains_credentials(target: &str) -> bool {
    let Some(scheme_index) = target.find("://") else {
        return false;
    };
    let authority_start = scheme_index + 3;
    let authority_end = target[authority_start..]
        .find(['/', '?', '#'])
        .map(|offset| authority_start + offset)
        .unwrap_or(target.len());
    target[authority_start..authority_end].contains('@')
}

fn contains_sensitive_directive(value: &str) -> bool {
    let normalized = value.to_ascii_lowercase();
    normalized.contains("authorization")
        || normalized.contains("cookie")
        || normalized.contains("proxy_set_header auth")
        || normalized.contains("password")
        || normalized.contains("token")
        || normalized.contains("secret")
        || normalized.contains("credential")
        || normalized.contains("jwt")
        || normalized.contains("session")
}

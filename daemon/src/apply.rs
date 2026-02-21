use crate::config::DaemonConfig;
use crate::error::{DaemonError, Result};
use crate::renderer;
use crate::state_store::StateStore;
use chrono::Utc;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info};

pub struct ApplyService {
    store: Arc<StateStore>,
    config: DaemonConfig,
    apply_lock: Mutex<()>,
}

impl ApplyService {
    pub fn new(store: Arc<StateStore>, config: DaemonConfig) -> Self {
        Self {
            store,
            config,
            apply_lock: Mutex::new(()),
        }
    }

    pub async fn reconcile_once(&self) -> Result<()> {
        let _guard = self.apply_lock.lock().await;

        let state = self.store.get_state().await;
        let status = self.store.get_status().await;
        if status.observed_revision >= state.revision {
            return Ok(());
        }

        self.store.mark_applying().await;
        info!(revision = state.revision, "starting apply pipeline");

        let result = (|| {
            let rendered = renderer::render_to_staging(&self.config.staging_dir, &state)?;
            self.validate(&rendered.staging_conf_path)?;
            self.backup()?
                ;
            self.commit_staging()?;
            self.reload()?;
            Ok::<String, DaemonError>(rendered.config_hash)
        })();

        match result {
            Ok(hash) => {
                self.store.mark_in_sync(state.revision, hash).await;
                info!(revision = state.revision, "apply pipeline completed");
                Ok(())
            }
            Err(err) => {
                error!(revision = state.revision, error = %err, "apply pipeline failed");
                self.store.mark_degraded(err.to_string()).await;
                Err(err)
            }
        }
    }

    fn validate(&self, staging_conf: &Path) -> Result<()> {
        if self.config.dry_run {
            return Ok(());
        }

        let cmd = self
            .config
            .nginx_test_cmd
            .replace("{staging_conf}", &staging_conf.to_string_lossy());
        run_shell(&cmd)
    }

    fn backup(&self) -> Result<PathBuf> {
        let snapshot_id = Utc::now().format("%Y%m%d%H%M%S").to_string();
        let snapshot_dir = self.config.backups_dir.join(snapshot_id);
        std::fs::create_dir_all(&snapshot_dir)?;

        if self.config.state_path.exists() {
            std::fs::copy(&self.config.state_path, snapshot_dir.join("state.json"))?;
        }

        if self.config.runtime_output_dir.exists() {
            copy_dir_recursive(&self.config.runtime_output_dir, &snapshot_dir.join("runtime"))?;
        }

        Ok(snapshot_dir)
    }

    fn commit_staging(&self) -> Result<()> {
        if self.config.runtime_output_dir.exists() {
            std::fs::remove_dir_all(&self.config.runtime_output_dir)?;
        }

        if let Some(parent) = self.config.runtime_output_dir.parent() {
            std::fs::create_dir_all(parent)?;
        }

        copy_dir_recursive(&self.config.staging_dir, &self.config.runtime_output_dir)?;
        Ok(())
    }

    fn reload(&self) -> Result<()> {
        if self.config.dry_run {
            return Ok(());
        }

        run_shell(&self.config.reload_cmd)
    }
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<()> {
    if !src.exists() {
        return Ok(());
    }

    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if entry.file_type()?.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(src_path, dst_path)?;
        }
    }

    Ok(())
}

fn run_shell(command: &str) -> Result<()> {
    #[cfg(target_os = "windows")]
    let output = Command::new("cmd").arg("/C").arg(command).output()?;

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("sh").arg("-c").arg(command).output()?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        Err(DaemonError::Internal(format!(
            "command failed [{}]: {}",
            command, stderr
        )))
    }
}

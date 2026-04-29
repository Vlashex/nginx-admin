use crate::config::DaemonConfig;
use crate::error::{DaemonError, Result};
use crate::renderer;
use crate::state_store::StateStore;
use chrono::Utc;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, error, info, warn};

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
        let runtime_hash = hash_directory(&self.config.runtime_output_dir)?;
        let runtime_missing = runtime_hash.is_none();
        let drift_detected = runtime_missing
            || match (&status.active_config_hash, runtime_hash.as_deref()) {
                (Some(expected), Some(actual)) => expected != actual,
                (Some(_), None) => true,
                (None, Some(_)) => true,
                _ => false,
            };

        if status.observed_revision >= state.revision && !drift_detected {
            debug!(
                desired_revision = status.desired_revision,
                observed_revision = status.observed_revision,
                "reconcile skipped (already in sync)"
            );
            return Ok(());
        }

        if drift_detected {
            let reason = drift_reason(
                &self.config.runtime_output_dir,
                status.active_config_hash.as_deref(),
                runtime_hash.as_deref(),
            );
            self.store.mark_out_of_sync(reason.clone()).await;
            warn!(
                observed_revision = status.observed_revision,
                desired_revision = status.desired_revision,
                reason = %reason,
                "drift detected, forcing re-apply"
            );
        }

        self.store.mark_applying().await;
        info!(revision = state.revision, "starting apply pipeline");

        let result = (|| {
            let rendered = renderer::render_to_staging(&self.config.staging_dir, &state)?;
            info!(
                revision = state.revision,
                staging_dir = %self.config.staging_dir.display(),
                "rendered staging config"
            );
            self.validate(&rendered.staging_conf_path)?;
            let snapshot_archive = self.backup()?;
            info!(
                revision = state.revision,
                backup_archive = %snapshot_archive.display(),
                "backup created"
            );
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
            debug!("validate skipped (dry_run)");
            return Ok(());
        }

        let cmd = self
            .config
            .nginx_test_cmd
            .replace("{staging_conf}", &staging_conf.to_string_lossy())
            .replace("{staging_dir}", &self.config.staging_dir.to_string_lossy());
        debug!(command = %cmd, "running nginx config test");
        run_shell(&cmd)
    }

    fn backup(&self) -> Result<PathBuf> {
        let snapshot_id = Utc::now().format("%Y%m%d%H%M%S").to_string();
        std::fs::create_dir_all(&self.config.backups_dir)?;
        let snapshot_archive = self
            .config
            .backups_dir
            .join(format!("{}.tar.gz", snapshot_id));
        let cmd = format!(
            "tar -czf {} {} {}",
            shell_escape(&snapshot_archive),
            shell_escape(Path::new("/etc/nginx")),
            shell_escape(&self.config.state_path)
        );
        debug!(command = %cmd, "creating backup snapshot");
        run_shell(&cmd)?;

        Ok(snapshot_archive)
    }

    fn commit_staging(&self) -> Result<()> {
        if let Some(parent) = self.config.runtime_output_dir.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let previous_runtime_dir = self.config.runtime_output_dir.with_extension("previous");
        if previous_runtime_dir.exists() {
            std::fs::remove_dir_all(&previous_runtime_dir)?;
        }
        if self.config.runtime_output_dir.exists() {
            std::fs::rename(&self.config.runtime_output_dir, &previous_runtime_dir)?;
        }

        if let Err(err) = std::fs::rename(&self.config.staging_dir, &self.config.runtime_output_dir) {
            if previous_runtime_dir.exists() {
                let _ = std::fs::rename(&previous_runtime_dir, &self.config.runtime_output_dir);
            }
            return Err(err.into());
        }

        if previous_runtime_dir.exists() {
            std::fs::remove_dir_all(&previous_runtime_dir)?;
        }

        info!(
            runtime_dir = %self.config.runtime_output_dir.display(),
            "staging atomically switched to runtime"
        );
        Ok(())
    }

    fn reload(&self) -> Result<()> {
        if self.config.dry_run {
            debug!("reload skipped (dry_run)");
            return Ok(());
        }

        info!(command = %self.config.reload_cmd, "reloading nginx");
        run_shell(&self.config.reload_cmd)
    }
}

fn hash_directory(path: &Path) -> Result<Option<String>> {
    if !path.exists() {
        return Ok(None);
    }

    let mut files = Vec::new();
    collect_files(path, &mut files)?;
    files.sort();

    let mut hasher = Sha256::new();
    for file in files {
        hasher.update(file.to_string_lossy().as_bytes());
        hasher.update(std::fs::read(&file)?);
    }
    Ok(Some(hex::encode(hasher.finalize())))
}

fn drift_reason(path: &Path, expected_hash: Option<&str>, active_hash: Option<&str>) -> String {
    match (expected_hash, active_hash) {
        (_, None) => format!("runtime output is missing: {}", path.display()),
        (None, Some(actual)) => format!(
            "runtime output exists but no activeConfigHash has been observed yet: activeConfigHash={}",
            actual
        ),
        (Some(expected), Some(actual)) => format!(
            "active runtime hash differs from observed hash: expected activeConfigHash={}, actual activeConfigHash={}",
            expected, actual
        ),
    }
}

fn collect_files(path: &Path, out: &mut Vec<PathBuf>) -> Result<()> {
    for entry in std::fs::read_dir(path)? {
        let entry = entry?;
        let entry_path = entry.path();

        if entry.file_type()?.is_dir() {
            collect_files(&entry_path, out)?;
        } else {
            out.push(entry_path);
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
        debug!(command, "command succeeded");
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        warn!(command, stderr = %stderr, "command failed");
        Err(DaemonError::Internal(format!(
            "command failed [{}]: {}",
            command, stderr
        )))
    }
}

fn shell_escape(path: &Path) -> String {
    let raw = path.to_string_lossy();
    format!("'{}'", raw.replace('\'', "'\"'\"'"))
}

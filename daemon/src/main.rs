mod api;
mod apply;
mod config;
mod error;
mod model;
mod renderer;
mod state_store;

use api::{build_router, AppContext};
use apply::ApplyService;
use config::DaemonConfig;
use fs2::FileExt;
#[cfg(unix)]
use hyper::service::service_fn;
#[cfg(unix)]
use hyper::server::conn::http1;
#[cfg(unix)]
use hyper_util::rt::TokioIo;
use state_store::StateStore;
use std::fs::{File, OpenOptions};
use std::path::Path;
use std::process::Command;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
#[cfg(unix)]
use tower::ServiceExt;
use tracing::{error, info, warn};

const INSTANCE_LOCK_PATH: &str = "/run/nginx-admind.lock";

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    if let Err(err) = run().await {
        error!(error = %err, "daemon terminated with error");
        std::process::exit(1);
    }
}

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let _instance_lock = acquire_instance_lock()?;

    let config = DaemonConfig::from_env();
    info!(
        unix_socket_path = %config.unix_socket_path.display(),
        socket_group = %config.socket_group,
        state_path = %config.state_path.display(),
        staging_dir = %config.staging_dir.display(),
        runtime_output_dir = %config.runtime_output_dir.display(),
        backups_dir = %config.backups_dir.display(),
        reconcile_interval_secs = config.reconcile_interval.as_secs(),
        dry_run = config.dry_run,
        "daemon configuration loaded"
    );

    let state_store = Arc::new(StateStore::load_or_init(config.state_path.clone()).await?);
    let apply_service = Arc::new(ApplyService::new(state_store.clone(), config.clone()));

    let ctx = AppContext {
        state_store: state_store.clone(),
        apply_service: apply_service.clone(),
    };

    let reconcile_interval = config.reconcile_interval;
    tokio::spawn(async move {
        reconcile_loop(apply_service, reconcile_interval).await;
    });

    let router = build_router(ctx);
    #[cfg(unix)]
    {
        prepare_unix_socket_path(&config.unix_socket_path)?;

        let listener = tokio::net::UnixListener::bind(&config.unix_socket_path)?;
        if let Err(err) =
            configure_unix_socket_permissions(&config.unix_socket_path, &config.socket_group)
        {
            cleanup_unix_socket_path(&config.unix_socket_path);
            return Err(err);
        }
        info!(
            socket = %config.unix_socket_path.display(),
            "unix socket created for HTTP server"
        );

        let serve_result = serve_unix(listener, router).await;
        cleanup_unix_socket_path(&config.unix_socket_path);
        serve_result?;
    }

    #[cfg(not(unix))]
    {
        let _ = router;
        return Err("unix socket mode is only supported on unix targets".into());
    }

    Ok(())
}

fn acquire_instance_lock() -> Result<File, Box<dyn std::error::Error>> {
    let lock_path = Path::new(INSTANCE_LOCK_PATH);
    if let Some(parent) = lock_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let file = OpenOptions::new()
        .create(true)
        .read(true)
        .write(true)
        .open(lock_path)?;

    if let Err(err) = file.try_lock_exclusive() {
        return Err(format!(
            "failed to acquire instance lock at {}: {} (another nginx-admind instance may be running)",
            lock_path.display(),
            err
        )
        .into());
    }

    info!(path = %lock_path.display(), "instance lock acquired");
    Ok(file)
}

async fn reconcile_loop(apply_service: Arc<ApplyService>, interval: Duration) {
    loop {
        if let Err(err) = apply_service.reconcile_once().await {
            warn!(error = %err, "reconcile iteration failed");
        }
        sleep(interval).await;
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sigterm) => {
                sigterm.recv().await;
            }
            Err(_) => std::future::pending::<()>().await,
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    info!("shutdown signal received");
}

#[cfg(unix)]
async fn serve_unix(
    listener: tokio::net::UnixListener,
    router: axum::Router,
) -> Result<(), Box<dyn std::error::Error>> {
    let shutdown = shutdown_signal();
    tokio::pin!(shutdown);

    loop {
        tokio::select! {
            _ = &mut shutdown => {
                break;
            }
            accept_result = listener.accept() => {
                let (stream, _) = accept_result?;
                let io = TokioIo::new(stream);
                let app = router.clone();

                tokio::spawn(async move {
                    let service = service_fn(move |request| {
                        let app = app.clone();
                        async move { app.oneshot(request.map(axum::body::Body::new)).await }
                    });
                    let result = http1::Builder::new().serve_connection(io, service).await;
                    if let Err(err) = result {
                        warn!(error = %err, "unix HTTP connection failed");
                    }
                });
            }
        }
    }

    Ok(())
}

fn prepare_unix_socket_path(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    if path.exists() {
        std::fs::remove_file(path)?;
        info!(socket = %path.display(), "removed existing unix socket file");
    }
    Ok(())
}

fn configure_unix_socket_permissions(
    path: &Path,
    socket_group: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o660))?;
        if group_exists(socket_group) {
            if let Err(err) = run_shell(&format!("chgrp {} {}", socket_group, shell_escape(path))) {
                warn!(
                    socket = %path.display(),
                    group = %socket_group,
                    error = %err,
                    "failed to change socket group; continuing"
                );
            }
        } else {
            warn!(
                socket = %path.display(),
                group = %socket_group,
                "socket group does not exist; continuing without chgrp"
            );
        }
        info!(
            socket = %path.display(),
            mode = "660",
            group = %socket_group,
            "unix socket permissions configured"
        );
    }
    Ok(())
}

fn cleanup_unix_socket_path(path: &Path) {
    if !path.exists() {
        return;
    }

    match std::fs::remove_file(path) {
        Ok(()) => info!(socket = %path.display(), "unix socket file removed"),
        Err(err) => warn!(
            socket = %path.display(),
            error = %err,
            "failed to remove unix socket file"
        ),
    }
}

fn run_shell(command: &str) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    let output = Command::new("cmd").arg("/C").arg(command).output()?;

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("sh").arg("-c").arg(command).output()?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        Err(format!("command failed [{}]: {}", command, stderr).into())
    }
}

fn shell_escape(path: &Path) -> String {
    let raw = path.to_string_lossy();
    format!("'{}'", raw.replace('\'', "'\"'\"'"))
}

#[cfg(unix)]
fn group_exists(group: &str) -> bool {
    if group.is_empty() {
        return false;
    }

    Command::new("getent")
        .arg("group")
        .arg(group)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

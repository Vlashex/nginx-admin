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
use state_store::StateStore;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{error, info, warn};

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
    let config = DaemonConfig::from_env();
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
    let addr: SocketAddr = config.bind_addr.parse()?;
    info!(bind = %addr, "starting nginx-admind");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
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

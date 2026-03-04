use crate::apply::ApplyService;
use crate::error::{DaemonError, Result};
use crate::model::{ControlPlaneState, RuntimeStatus};
use crate::state_store::StateStore;
use axum::extract::State;
use axum::http::{header::ETAG, HeaderMap, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, put};
use axum::{Json, Router};
use std::sync::Arc;
use tracing::{debug, info};

#[derive(Clone)]
pub struct AppContext {
    pub state_store: Arc<StateStore>,
    pub apply_service: Arc<ApplyService>,
}

pub fn build_router(context: AppContext) -> Router {
    Router::new()
        .route("/v1/state", get(get_state).put(put_state))
        .route("/v1/runtime/status", get(get_runtime_status))
        .route("/v1/reconcile", put(trigger_reconcile))
        .route("/healthz", get(healthz))
        .with_state(context)
}

async fn get_state(State(ctx): State<AppContext>) -> Result<impl IntoResponse> {
    debug!("get_state request");
    let state = ctx.state_store.get_state().await;
    debug!(revision = state.revision, "get_state response");
    let mut headers = HeaderMap::new();
    headers.insert(ETAG, etag_for_revision(state.revision)?);
    Ok((headers, Json(state)))
}

async fn put_state(
    State(ctx): State<AppContext>,
    headers: HeaderMap,
    Json(draft): Json<ControlPlaneState>,
) -> Result<impl IntoResponse> {
    let expected_revision = parse_if_match(&headers)?;
    info!(
        expected_revision,
        updated_by = %draft.updated_by,
        servers = draft.servers.len(),
        "put_state request"
    );
    let state = ctx.state_store.put_state(expected_revision, draft).await?;

    let mut response_headers = HeaderMap::new();
    response_headers.insert(ETAG, etag_for_revision(state.revision)?);

    info!(revision = state.revision, "put_state stored");
    Ok((StatusCode::OK, response_headers, Json(state)))
}

async fn get_runtime_status(State(ctx): State<AppContext>) -> Result<Json<RuntimeStatus>> {
    debug!("get_runtime_status request");
    let status = ctx.state_store.get_status().await;
    debug!(
        desired_revision = status.desired_revision,
        observed_revision = status.observed_revision,
        sync_state = ?status.sync_state,
        "get_runtime_status response"
    );
    Ok(Json(status))
}

async fn trigger_reconcile(State(ctx): State<AppContext>) -> Result<impl IntoResponse> {
    info!("trigger_reconcile request");
    ctx.apply_service.reconcile_once().await?;
    Ok(StatusCode::ACCEPTED)
}

async fn healthz() -> StatusCode {
    StatusCode::OK
}

fn parse_if_match(headers: &HeaderMap) -> Result<u64> {
    let raw = headers
        .get("if-match")
        .ok_or(DaemonError::PreconditionRequired)?
        .to_str()
        .map_err(|_| DaemonError::InvalidInput("invalid If-Match header".to_owned()))?;

    let normalized = raw.trim().trim_matches('"');
    normalized
        .parse::<u64>()
        .map_err(|_| DaemonError::InvalidInput("If-Match must be an integer revision".to_owned()))
}

fn etag_for_revision(revision: u64) -> Result<HeaderValue> {
    HeaderValue::from_str(&format!("\"{}\"", revision))
        .map_err(|err| DaemonError::Internal(format!("invalid ETag value: {}", err)))
}

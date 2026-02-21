use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DaemonError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("precondition required")]
    PreconditionRequired,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("internal error: {0}")]
    Internal(String),
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl IntoResponse for DaemonError {
    fn into_response(self) -> Response {
        let status = match self {
            DaemonError::NotFound(_) => StatusCode::NOT_FOUND,
            DaemonError::Conflict(_) => StatusCode::CONFLICT,
            DaemonError::InvalidInput(_) => StatusCode::BAD_REQUEST,
            DaemonError::PreconditionRequired => StatusCode::PRECONDITION_REQUIRED,
            DaemonError::Io(_) | DaemonError::Json(_) | DaemonError::Internal(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        };

        let body = Json(ErrorBody {
            error: self.to_string(),
        });

        (status, body).into_response()
    }
}

pub type Result<T> = std::result::Result<T, DaemonError>;

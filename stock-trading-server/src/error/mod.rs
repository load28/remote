use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    AuthError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Insufficient funds: {0}")]
    InsufficientFunds(String),

    #[error("Insufficient shares: {0}")]
    InsufficientShares(String),

    #[error("Invalid order: {0}")]
    InvalidOrder(String),

    #[error("Market closed")]
    MarketClosed,

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    InternalError(String),
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::AuthError(msg) => (StatusCode::UNAUTHORIZED, "AUTH_ERROR", msg.clone()),
            AppError::ValidationError(msg) => {
                (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg.clone())
            }
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg.clone()),
            AppError::InsufficientFunds(msg) => {
                (StatusCode::BAD_REQUEST, "INSUFFICIENT_FUNDS", msg.clone())
            }
            AppError::InsufficientShares(msg) => {
                (StatusCode::BAD_REQUEST, "INSUFFICIENT_SHARES", msg.clone())
            }
            AppError::InvalidOrder(msg) => (StatusCode::BAD_REQUEST, "INVALID_ORDER", msg.clone()),
            AppError::MarketClosed => (
                StatusCode::BAD_REQUEST,
                "MARKET_CLOSED",
                "Market is currently closed".to_string(),
            ),
            AppError::DatabaseError(e) => {
                tracing::error!("Database error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "DATABASE_ERROR",
                    "Database error occurred".to_string(),
                )
            }
            AppError::InternalError(msg) => {
                tracing::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL_ERROR",
                    "Internal server error".to_string(),
                )
            }
        };

        let body = Json(ErrorResponse {
            error: message,
            code: code.to_string(),
            details: None,
        });

        (status, body).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;

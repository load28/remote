use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

#[derive(Debug)]
pub enum GatewayError {
    BackendUnavailable,
    RequestFailed(String),
    InvalidRequest(String),
}

impl std::fmt::Display for GatewayError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GatewayError::BackendUnavailable => write!(f, "No backend servers available"),
            GatewayError::RequestFailed(msg) => write!(f, "Request failed: {}", msg),
            GatewayError::InvalidRequest(msg) => write!(f, "Invalid request: {}", msg),
        }
    }
}

impl std::error::Error for GatewayError {}

impl IntoResponse for GatewayError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            GatewayError::BackendUnavailable => {
                (StatusCode::SERVICE_UNAVAILABLE, self.to_string())
            }
            GatewayError::RequestFailed(msg) => (StatusCode::BAD_GATEWAY, msg),
            GatewayError::InvalidRequest(msg) => (StatusCode::BAD_REQUEST, msg),
        };

        (status, message).into_response()
    }
}

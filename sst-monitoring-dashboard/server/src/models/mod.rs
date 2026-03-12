pub mod auth;

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json as AxumJson;
use serde::{Deserialize, Serialize};

/// Application error type that returns proper HTTP status codes with JSON body.
pub struct AppError(pub String);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            AxumJson(serde_json::json!({ "error": self.0 })),
        )
            .into_response()
    }
}

impl From<String> for AppError {
    fn from(s: String) -> Self {
        AppError(s)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SstApp {
    pub name: String,
    pub stage: String,
    pub region: String,
    pub stack_name: String,
    pub status: String,
    pub last_updated: Option<String>,
    pub outputs: Vec<StackOutput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackOutput {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SstResource {
    pub logical_id: String,
    pub physical_id: String,
    pub resource_type: String,
    pub status: String,
    pub last_updated: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub timestamp: i64,
    pub message: String,
    pub log_stream: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogGroup {
    pub name: String,
    pub arn: String,
    pub stored_bytes: i64,
    pub retention_days: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct LogQuery {
    pub log_group: String,
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub filter_pattern: Option<String>,
    pub limit: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct LogGroupQuery {
    pub log_group: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AppQuery {
    pub stage: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionInfo {
    pub function_name: String,
    pub runtime: Option<String>,
    pub memory_size: Option<i32>,
    pub timeout: Option<i32>,
    pub last_modified: Option<String>,
    pub code_size: i64,
    pub handler: Option<String>,
    pub log_group: String,
}

#[derive(Debug, Serialize)]
pub struct WsMessage {
    pub event: String,
    pub data: serde_json::Value,
}

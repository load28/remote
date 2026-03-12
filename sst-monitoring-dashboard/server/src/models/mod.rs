use serde::{Deserialize, Serialize};

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
pub struct AppQuery {
    pub stage: Option<String>,
    pub region: Option<String>,
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

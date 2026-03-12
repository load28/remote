use axum::{extract::State, extract::Query, Json};

use crate::aws::{cloudwatch, AwsClients};
use crate::models::{LogEvent, LogGroup, LogQuery};

pub async fn list_log_groups(
    State(clients): State<AwsClients>,
    Query(query): Query<LogQuery>,
) -> Result<Json<Vec<LogGroup>>, String> {
    let prefix = if query.log_group.is_empty() {
        None
    } else {
        Some(query.log_group.as_str())
    };

    let groups = cloudwatch::list_log_groups(&clients.logs, prefix).await?;
    Ok(Json(groups))
}

pub async fn get_logs(
    State(clients): State<AwsClients>,
    Query(query): Query<LogQuery>,
) -> Result<Json<Vec<LogEvent>>, String> {
    let events = cloudwatch::get_log_events(
        &clients.logs,
        &query.log_group,
        query.start_time,
        query.end_time,
        query.filter_pattern.as_deref(),
        query.limit,
    )
    .await?;

    Ok(Json(events))
}

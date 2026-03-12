use axum::{extract::State, extract::Query, Json};

use crate::app_state::AppState;
use crate::auth::AuthUser;
use crate::aws::cloudwatch;
use crate::models::{AppError, LogEvent, LogGroup, LogGroupQuery, LogQuery};

pub async fn list_log_groups(
    State(state): State<AppState>,
    _auth: AuthUser,
    Query(query): Query<LogGroupQuery>,
) -> Result<Json<Vec<LogGroup>>, AppError> {
    let prefix = query.log_group.as_deref().filter(|s| !s.is_empty());
    let groups = cloudwatch::list_log_groups(&state.aws.logs, prefix).await?;
    Ok(Json(groups))
}

pub async fn get_logs(
    State(state): State<AppState>,
    _auth: AuthUser,
    Query(query): Query<LogQuery>,
) -> Result<Json<Vec<LogEvent>>, AppError> {
    let events = cloudwatch::get_log_events(
        &state.aws.logs,
        &query.log_group,
        query.start_time,
        query.end_time,
        query.filter_pattern.as_deref(),
        query.limit,
    )
    .await?;

    Ok(Json(events))
}

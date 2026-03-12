use aws_sdk_cloudwatchlogs::Client;

use crate::models::{LogEvent, LogGroup};

/// List log groups, optionally filtered by prefix (e.g., /aws/lambda/{stage}-{app})
pub async fn list_log_groups(
    client: &Client,
    prefix: Option<&str>,
) -> Result<Vec<LogGroup>, String> {
    let mut groups = Vec::new();
    let mut next_token: Option<String> = None;

    loop {
        let mut req = client.describe_log_groups();

        if let Some(p) = prefix {
            req = req.log_group_name_prefix(p);
        }

        if let Some(token) = &next_token {
            req = req.next_token(token);
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Failed to list log groups: {e}"))?;

        if let Some(log_groups) = resp.log_groups {
            for lg in log_groups {
                groups.push(LogGroup {
                    name: lg.log_group_name().unwrap_or_default().to_string(),
                    arn: lg.arn().unwrap_or_default().to_string(),
                    stored_bytes: lg.stored_bytes().unwrap_or(0),
                    retention_days: lg.retention_in_days(),
                });
            }
        }

        next_token = resp.next_token;
        if next_token.is_none() {
            break;
        }
    }

    Ok(groups)
}

/// Fetch recent log events from a log group
pub async fn get_log_events(
    client: &Client,
    log_group: &str,
    start_time: Option<i64>,
    end_time: Option<i64>,
    filter_pattern: Option<&str>,
    limit: Option<i32>,
) -> Result<Vec<LogEvent>, String> {
    let mut req = client
        .filter_log_events()
        .log_group_name(log_group)
        .limit(limit.unwrap_or(100));

    if let Some(start) = start_time {
        req = req.start_time(start);
    }

    if let Some(end) = end_time {
        req = req.end_time(end);
    }

    if let Some(pattern) = filter_pattern {
        if !pattern.is_empty() {
            req = req.filter_pattern(pattern);
        }
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("Failed to filter log events: {e}"))?;

    let events = resp
        .events()
        .iter()
        .map(|e| LogEvent {
            timestamp: e.timestamp().unwrap_or(0),
            message: e.message().unwrap_or_default().to_string(),
            log_stream: e.log_stream_name().unwrap_or_default().to_string(),
        })
        .collect();

    Ok(events)
}

/// Tail log events in real-time by polling with a forward token.
/// Returns (events, next_forward_token)
pub async fn tail_log_events(
    client: &Client,
    log_group: &str,
    next_token: Option<&str>,
) -> Result<(Vec<LogEvent>, Option<String>), String> {
    let now = chrono::Utc::now().timestamp_millis();
    let start = now - 30_000; // last 30 seconds if no token

    let mut req = client
        .filter_log_events()
        .log_group_name(log_group)
        .limit(50);

    if let Some(token) = next_token {
        req = req.next_token(token);
    } else {
        req = req.start_time(start);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("Failed to tail logs: {e}"))?;

    let events: Vec<LogEvent> = resp
        .events()
        .iter()
        .map(|e| LogEvent {
            timestamp: e.timestamp().unwrap_or(0),
            message: e.message().unwrap_or_default().to_string(),
            log_stream: e.log_stream_name().unwrap_or_default().to_string(),
        })
        .collect();

    let forward_token = resp.next_token().map(|s| s.to_string());

    Ok((events, forward_token))
}

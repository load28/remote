use aws_sdk_cloudformation::Client;

use crate::models::{SstApp, SstResource, StackOutput};

/// List all SST-related CloudFormation stacks.
/// SST stacks typically follow the naming pattern: {stage}-{app}-{stack}
pub async fn list_sst_stacks(
    client: &Client,
    stage_filter: Option<&str>,
) -> Result<Vec<SstApp>, String> {
    let mut apps = Vec::new();
    let mut next_token: Option<String> = None;

    loop {
        let mut req = client.list_stacks().stack_status_filter(
            aws_sdk_cloudformation::types::StackStatus::CreateComplete,
        ).stack_status_filter(
            aws_sdk_cloudformation::types::StackStatus::UpdateComplete,
        ).stack_status_filter(
            aws_sdk_cloudformation::types::StackStatus::UpdateRollbackComplete,
        ).stack_status_filter(
            aws_sdk_cloudformation::types::StackStatus::RollbackComplete,
        );

        if let Some(token) = &next_token {
            req = req.next_token(token);
        }

        let resp = req.send().await.map_err(|e| format!("Failed to list stacks: {e}"))?;

        if let Some(summaries) = resp.stack_summaries {
            for summary in summaries {
                let stack_name = summary.stack_name().unwrap_or_default();

                // SST v2+ stacks have tags with sst:app, sst:stage
                // Also detect by naming convention
                if is_sst_stack(stack_name) {
                    if let Some(stage) = &stage_filter {
                        if !stack_name.starts_with(stage) {
                            continue;
                        }
                    }

                    let (app_name, stage) = parse_sst_stack_name(stack_name);

                    apps.push(SstApp {
                        name: app_name,
                        stage,
                        region: String::new(), // filled by caller
                        stack_name: stack_name.to_string(),
                        status: summary
                            .stack_status()
                            .map(|s| format!("{s:?}"))
                            .unwrap_or_default(),
                        last_updated: summary
                            .last_updated_time()
                            .or(summary.creation_time())
                            .map(|t| t.fmt(aws_sdk_cloudformation::primitives::DateTimeFormat::DateTime).unwrap_or_default()),
                        outputs: Vec::new(),
                    });
                }
            }
        }

        next_token = resp.next_token;
        if next_token.is_none() {
            break;
        }
    }

    // Enrich with stack details (outputs)
    for app in &mut apps {
        if let Ok(details) = get_stack_details(client, &app.stack_name).await {
            app.outputs = details;
        }
    }

    Ok(apps)
}

async fn get_stack_details(
    client: &Client,
    stack_name: &str,
) -> Result<Vec<StackOutput>, String> {
    let resp = client
        .describe_stacks()
        .stack_name(stack_name)
        .send()
        .await
        .map_err(|e| format!("Failed to describe stack: {e}"))?;

    let outputs = resp
        .stacks()
        .first()
        .map(|stack| {
            stack
                .outputs()
                .iter()
                .map(|o| StackOutput {
                    key: o.output_key().unwrap_or_default().to_string(),
                    value: o.output_value().unwrap_or_default().to_string(),
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(outputs)
}

/// List resources within a specific stack
pub async fn list_stack_resources(
    client: &Client,
    stack_name: &str,
) -> Result<Vec<SstResource>, String> {
    let mut resources = Vec::new();
    let mut next_token: Option<String> = None;

    loop {
        let mut req = client.list_stack_resources().stack_name(stack_name);

        if let Some(token) = &next_token {
            req = req.next_token(token);
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Failed to list resources: {e}"))?;

        if let Some(summaries) = resp.stack_resource_summaries {
            for summary in summaries {
                resources.push(SstResource {
                    logical_id: summary.logical_resource_id().unwrap_or_default().to_string(),
                    physical_id: summary
                        .physical_resource_id()
                        .unwrap_or_default()
                        .to_string(),
                    resource_type: summary.resource_type().unwrap_or_default().to_string(),
                    status: summary
                        .resource_status()
                        .map(|s| format!("{s:?}"))
                        .unwrap_or_default(),
                    last_updated: summary.last_updated_timestamp().map(|t| {
                        t.fmt(aws_sdk_cloudformation::primitives::DateTimeFormat::DateTime)
                            .unwrap_or_default()
                    }),
                });
            }
        }

        next_token = resp.next_token;
        if next_token.is_none() {
            break;
        }
    }

    Ok(resources)
}

fn is_sst_stack(name: &str) -> bool {
    // SST stacks typically contain "sst" in metadata or follow pattern
    // Common patterns: {stage}-{app}-{StackName}
    // We also check for SSTMetadata resource later
    // For now, use heuristic: contains at least 2 dashes (stage-app-stack)
    let parts: Vec<&str> = name.split('-').collect();
    parts.len() >= 2
}

fn parse_sst_stack_name(name: &str) -> (String, String) {
    let parts: Vec<&str> = name.split('-').collect();
    if parts.len() >= 3 {
        let stage = parts[0].to_string();
        let app = parts[1..parts.len() - 1].join("-");
        (app, stage)
    } else if parts.len() == 2 {
        (parts[1].to_string(), parts[0].to_string())
    } else {
        (name.to_string(), "unknown".to_string())
    }
}

use aws_sdk_cloudformation::Client;

use crate::models::{SstApp, SstResource, StackOutput};

/// List all SST-related CloudFormation stacks.
/// SST v2+ stacks have tags: sst:app, sst:stage.
/// Uses describe_stacks (paginated) to get full stack details including tags,
/// avoiding per-stack API calls that could cause rate limiting.
pub async fn list_sst_stacks(
    client: &Client,
    stage_filter: Option<&str>,
) -> Result<Vec<SstApp>, String> {
    let mut apps = Vec::new();
    let mut next_token: Option<String> = None;

    // Paginate through all stacks using describe_stacks (returns tags, outputs, etc.)
    loop {
        let mut req = client.describe_stacks();

        if let Some(token) = &next_token {
            req = req.next_token(token);
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Failed to describe stacks: {e}"))?;

        for stack in resp.stacks() {
            // Skip non-active stacks
            let status = stack
                .stack_status()
                .map(|s| format!("{s:?}"))
                .unwrap_or_default();

            if !matches!(
                stack.stack_status(),
                Some(
                    aws_sdk_cloudformation::types::StackStatus::CreateComplete
                        | aws_sdk_cloudformation::types::StackStatus::UpdateComplete
                        | aws_sdk_cloudformation::types::StackStatus::UpdateRollbackComplete
                )
            ) {
                continue;
            }

            // Check for SST tags: sst:app and sst:stage
            let tags = stack.tags();
            let sst_app_tag = tags.iter().find(|t| t.key() == Some("sst:app"));
            let sst_stage_tag = tags.iter().find(|t| t.key() == Some("sst:stage"));

            let (app_name, stage) =
                if let (Some(app_tag), Some(stage_tag)) = (sst_app_tag, sst_stage_tag) {
                    (
                        app_tag.value().unwrap_or_default().to_string(),
                        stage_tag.value().unwrap_or_default().to_string(),
                    )
                } else {
                    // No SST tags - not an SST stack
                    continue;
                };

            // Apply stage filter
            if let Some(filter) = &stage_filter {
                if stage != *filter {
                    continue;
                }
            }

            let stack_name = stack.stack_name().unwrap_or_default().to_string();

            let outputs: Vec<StackOutput> = stack
                .outputs()
                .iter()
                .map(|o| StackOutput {
                    key: o.output_key().unwrap_or_default().to_string(),
                    value: o.output_value().unwrap_or_default().to_string(),
                })
                .collect();

            let last_updated = stack
                .last_updated_time()
                .or(stack.creation_time())
                .map(|t| {
                    t.fmt(aws_sdk_cloudformation::primitives::DateTimeFormat::DateTime)
                        .unwrap_or_default()
                });

            apps.push(SstApp {
                name: app_name,
                stage,
                region: String::new(), // filled by caller
                stack_name,
                status,
                last_updated,
                outputs,
            });
        }

        next_token = resp.next_token().map(|s| s.to_string());
        if next_token.is_none() {
            break;
        }
    }

    Ok(apps)
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

use axum::{extract::Path, extract::State, Json};

use crate::aws::{cloudformation, lambda, AwsClients};
use crate::models::{AppError, AppQuery, FunctionInfo, SstApp, SstResource};

pub async fn list_apps(
    State(clients): State<AwsClients>,
    axum::extract::Query(query): axum::extract::Query<AppQuery>,
) -> Result<Json<Vec<SstApp>>, AppError> {
    let mut apps =
        cloudformation::list_sst_stacks(&clients.cf, query.stage.as_deref()).await?;

    let region = clients
        .cf
        .config()
        .region()
        .map(|r| r.to_string())
        .unwrap_or_else(|| "us-east-1".to_string());

    for app in &mut apps {
        app.region = region.clone();
    }

    Ok(Json(apps))
}

pub async fn get_app_resources(
    State(clients): State<AwsClients>,
    Path(stack_name): Path<String>,
) -> Result<Json<Vec<SstResource>>, AppError> {
    let resources = cloudformation::list_stack_resources(&clients.cf, &stack_name).await?;
    Ok(Json(resources))
}

pub async fn get_app_functions(
    State(clients): State<AwsClients>,
    Path(stack_name): Path<String>,
) -> Result<Json<Vec<FunctionInfo>>, AppError> {
    // Get Lambda function physical IDs from the stack's resources
    let resources = cloudformation::list_stack_resources(&clients.cf, &stack_name).await?;

    let lambda_physical_ids: Vec<String> = resources
        .iter()
        .filter(|r| r.resource_type == "AWS::Lambda::Function")
        .map(|r| r.physical_id.clone())
        .filter(|id| !id.is_empty())
        .collect();

    // Fetch details for each Lambda function found in the stack
    let mut functions = Vec::new();
    for function_name in &lambda_physical_ids {
        match lambda::get_function(&clients.lambda, function_name).await {
            Ok(info) => functions.push(info),
            Err(_) => continue, // Skip functions that can't be described
        }
    }

    Ok(Json(functions))
}

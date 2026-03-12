use axum::{extract::Path, extract::State, Json};

use crate::app_state::AppState;
use crate::auth::AuthUser;
use crate::aws::{cloudformation, lambda};
use crate::models::{AppError, AppQuery, FunctionInfo, SstApp, SstResource};

pub async fn list_apps(
    State(state): State<AppState>,
    _auth: AuthUser,
    axum::extract::Query(query): axum::extract::Query<AppQuery>,
) -> Result<Json<Vec<SstApp>>, AppError> {
    let clients = &state.aws;
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
    State(state): State<AppState>,
    _auth: AuthUser,
    Path(stack_name): Path<String>,
) -> Result<Json<Vec<SstResource>>, AppError> {
    let clients = &state.aws;
    let resources = cloudformation::list_stack_resources(&clients.cf, &stack_name).await?;
    Ok(Json(resources))
}

pub async fn get_app_functions(
    State(state): State<AppState>,
    _auth: AuthUser,
    Path(stack_name): Path<String>,
) -> Result<Json<Vec<FunctionInfo>>, AppError> {
    let clients = &state.aws;
    // Get Lambda function physical IDs from the stack's resources
    let resources = cloudformation::list_stack_resources(&clients.cf, &stack_name).await?;

    let lambda_physical_ids: Vec<String> = resources
        .iter()
        .filter(|r| r.resource_type == "AWS::Lambda::Function")
        .map(|r| r.physical_id.clone())
        .filter(|id| !id.is_empty())
        .collect();

    // Fetch details for each Lambda function in parallel
    let futures: Vec<_> = lambda_physical_ids
        .iter()
        .map(|name| lambda::get_function(&clients.lambda, name))
        .collect();

    let results = futures::future::join_all(futures).await;
    let functions: Vec<FunctionInfo> = results
        .into_iter()
        .filter_map(|r| r.ok())
        .collect();

    Ok(Json(functions))
}

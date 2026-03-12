use axum::{extract::State, extract::Path, Json};

use crate::aws::{cloudformation, lambda, AwsClients};
use crate::models::{AppQuery, FunctionInfo, SstApp, SstResource};

pub async fn list_apps(
    State(clients): State<AwsClients>,
    axum::extract::Query(query): axum::extract::Query<AppQuery>,
) -> Result<Json<Vec<SstApp>>, String> {
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
) -> Result<Json<Vec<SstResource>>, String> {
    let resources = cloudformation::list_stack_resources(&clients.cf, &stack_name).await?;
    Ok(Json(resources))
}

pub async fn get_app_functions(
    State(clients): State<AwsClients>,
    Path(stack_name): Path<String>,
) -> Result<Json<Vec<FunctionInfo>>, String> {
    // SST functions typically have prefix: {stage}-{app}-
    let prefix = stack_name
        .rsplit_once('-')
        .map(|(base, _)| format!("{base}-"))
        .unwrap_or(stack_name.clone());

    let functions = lambda::list_functions(&clients.lambda, Some(&prefix)).await?;
    Ok(Json(functions))
}

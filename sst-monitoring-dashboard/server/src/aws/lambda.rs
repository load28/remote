use aws_sdk_lambda::Client;

use crate::models::FunctionInfo;

/// List Lambda functions, optionally filtered by prefix
pub async fn list_functions(
    client: &Client,
    prefix: Option<&str>,
) -> Result<Vec<FunctionInfo>, String> {
    let mut functions = Vec::new();
    let mut marker: Option<String> = None;

    loop {
        let mut req = client.list_functions().max_items(50);

        if let Some(m) = &marker {
            req = req.marker(m);
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Failed to list functions: {e}"))?;

        for f in resp.functions() {
            let name = f.function_name().unwrap_or_default();

            if let Some(p) = prefix {
                if !name.starts_with(p) {
                    continue;
                }
            }

            functions.push(FunctionInfo {
                function_name: name.to_string(),
                runtime: f.runtime().map(|r| format!("{r:?}")),
                memory_size: f.memory_size(),
                timeout: f.timeout(),
                last_modified: f.last_modified().map(|s| s.to_string()),
                code_size: f.code_size(),
                handler: f.handler().map(|s| s.to_string()),
                log_group: format!("/aws/lambda/{name}"),
            });
        }

        marker = resp.next_marker().map(|s| s.to_string());
        if marker.is_none() {
            break;
        }
    }

    Ok(functions)
}

/// Get details for a specific Lambda function
pub async fn get_function(
    client: &Client,
    function_name: &str,
) -> Result<FunctionInfo, String> {
    let resp = client
        .get_function()
        .function_name(function_name)
        .send()
        .await
        .map_err(|e| format!("Failed to get function: {e}"))?;

    let config = resp
        .configuration()
        .ok_or("No configuration found")?;

    let name = config.function_name().unwrap_or_default();

    Ok(FunctionInfo {
        function_name: name.to_string(),
        runtime: config.runtime().map(|r| format!("{r:?}")),
        memory_size: config.memory_size(),
        timeout: config.timeout(),
        last_modified: config.last_modified().map(|s| s.to_string()),
        code_size: config.code_size(),
        handler: config.handler().map(|s| s.to_string()),
        log_group: format!("/aws/lambda/{name}"),
    })
}

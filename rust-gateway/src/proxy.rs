use axum::body::Body;
use axum::extract::State;
use axum::http::{HeaderMap, HeaderValue, Method, Request, StatusCode};
use axum::response::{IntoResponse, Response};
use reqwest::Client;
use tracing::{error, info};

use crate::error::GatewayError;
use crate::load_balancer::LoadBalancer;

#[derive(Clone)]
pub struct AppState {
    pub load_balancer: LoadBalancer,
    pub client: Client,
}

/// Proxy handler that forwards requests to backend servers
pub async fn proxy_handler(
    State(state): State<AppState>,
    request: Request<Body>,
) -> Result<Response, GatewayError> {
    let backend_url = state
        .load_balancer
        .next_server()
        .ok_or(GatewayError::BackendUnavailable)?;

    let method = request.method().clone();
    let uri = request.uri().clone();
    let headers = request.headers().clone();

    let path_and_query = uri
        .path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/");

    let target_url = format!("{}{}", backend_url, path_and_query);

    info!(
        method = %method,
        path = %path_and_query,
        backend = %backend_url,
        "Proxying request"
    );

    // Read body bytes
    let body_bytes = axum::body::to_bytes(request.into_body(), usize::MAX)
        .await
        .map_err(|e| GatewayError::InvalidRequest(e.to_string()))?;

    // Build the proxied request
    let mut req_builder = match method {
        Method::GET => state.client.get(&target_url),
        Method::POST => state.client.post(&target_url),
        Method::PUT => state.client.put(&target_url),
        Method::DELETE => state.client.delete(&target_url),
        Method::PATCH => state.client.patch(&target_url),
        Method::HEAD => state.client.head(&target_url),
        _ => {
            return Err(GatewayError::InvalidRequest(format!(
                "Unsupported method: {}",
                method
            )))
        }
    };

    // Forward headers (excluding hop-by-hop headers)
    req_builder = forward_headers(req_builder, &headers);

    // Add body if present
    if !body_bytes.is_empty() {
        req_builder = req_builder.body(body_bytes);
    }

    // Send request to backend
    let backend_response = req_builder
        .send()
        .await
        .map_err(|e| {
            error!(error = %e, backend = %backend_url, "Backend request failed");
            GatewayError::RequestFailed(e.to_string())
        })?;

    // Build response
    let status = StatusCode::from_u16(backend_response.status().as_u16())
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    let response_headers = backend_response.headers().clone();
    let response_body = backend_response
        .bytes()
        .await
        .map_err(|e| GatewayError::RequestFailed(e.to_string()))?;

    let mut response = Response::builder().status(status);

    // Forward response headers
    for (name, value) in response_headers.iter() {
        if !is_hop_by_hop_header(name.as_str()) {
            if let Ok(header_value) = HeaderValue::from_bytes(value.as_bytes()) {
                response = response.header(name.as_str(), header_value);
            }
        }
    }

    response
        .body(Body::from(response_body))
        .map_err(|e| GatewayError::RequestFailed(e.to_string()))
}

fn forward_headers(mut builder: reqwest::RequestBuilder, headers: &HeaderMap) -> reqwest::RequestBuilder {
    for (name, value) in headers.iter() {
        let name_str = name.as_str();

        // Skip hop-by-hop headers and host
        if is_hop_by_hop_header(name_str) || name_str.eq_ignore_ascii_case("host") {
            continue;
        }

        if let Ok(value_str) = value.to_str() {
            builder = builder.header(name_str, value_str);
        }
    }
    builder
}

fn is_hop_by_hop_header(name: &str) -> bool {
    matches!(
        name.to_lowercase().as_str(),
        "connection"
            | "keep-alive"
            | "proxy-authenticate"
            | "proxy-authorization"
            | "te"
            | "trailers"
            | "transfer-encoding"
            | "upgrade"
    )
}

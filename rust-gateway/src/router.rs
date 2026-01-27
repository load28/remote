use axum::routing::any;
use axum::Router;

use crate::proxy::{proxy_handler, AppState};

/// Create the application router
pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Health check endpoint
        .route("/health", any(health_check))
        // Catch-all route for proxying
        .route("/*path", any(proxy_handler))
        .route("/", any(proxy_handler))
        .with_state(state)
}

async fn health_check() -> &'static str {
    "OK"
}

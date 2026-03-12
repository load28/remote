mod app_state;
mod auth;
mod aws;
mod db;
mod email;
mod models;
mod routes;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::CorsLayer;
use tracing_subscriber::EnvFilter;

use app_state::AppState;
use aws::AwsClients;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    // Initialize database
    let db = db::init_db();
    tracing::info!("Database initialized");

    // Load AWS config
    let aws_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let aws_clients = AwsClients::new(&aws_config);

    tracing::info!(
        region = ?aws_config.region(),
        "AWS clients initialized"
    );

    let state = AppState {
        aws: aws_clients,
        db,
    };

    // CORS configuration
    let cors = {
        let allowed_origin = std::env::var("CORS_ORIGIN").unwrap_or_else(|_| "*".to_string());
        let cors = CorsLayer::new()
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any);
        if allowed_origin == "*" {
            tracing::warn!("CORS_ORIGIN not set, allowing all origins. Set CORS_ORIGIN for production.");
            cors.allow_origin(tower_http::cors::Any)
        } else {
            let origin: axum::http::HeaderValue = allowed_origin.parse().expect("Invalid CORS_ORIGIN value");
            cors.allow_origin(origin)
        }
    };

    // Build router
    let app = Router::new()
        // Auth endpoints (public)
        .route("/api/auth/register", post(routes::auth_routes::register))
        .route("/api/auth/login", post(routes::auth_routes::login))
        .route("/api/auth/verify-email", get(routes::auth_routes::verify_email))
        .route("/api/auth/me", get(routes::auth_routes::me))
        // Admin endpoints (requires admin role)
        .route("/api/admin/users", get(routes::admin::list_users))
        .route("/api/admin/users/{user_id}/approve", post(routes::admin::approve_user))
        .route("/api/admin/users/{user_id}/reject", post(routes::admin::reject_user))
        // App/Stack endpoints (requires auth)
        .route("/api/apps", get(routes::apps::list_apps))
        .route("/api/apps/{stack_name}/resources", get(routes::apps::get_app_resources))
        .route("/api/apps/{stack_name}/functions", get(routes::apps::get_app_functions))
        // Log endpoints (requires auth)
        .route("/api/logs/groups", get(routes::logs::list_log_groups))
        .route("/api/logs/events", get(routes::logs::get_logs))
        // WebSocket for real-time logs (token via query param)
        .route("/ws", get(routes::ws::ws_handler))
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:3001";
    tracing::info!("Starting SST Monitor server on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

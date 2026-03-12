mod aws;
mod models;
mod routes;

use axum::{
    routing::{get},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;

use aws::AwsClients;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    // Load AWS config
    let aws_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let clients = AwsClients::new(&aws_config);

    tracing::info!(
        region = ?aws_config.region(),
        "AWS clients initialized"
    );

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        // App/Stack endpoints
        .route("/api/apps", get(routes::apps::list_apps))
        .route("/api/apps/{stack_name}/resources", get(routes::apps::get_app_resources))
        .route("/api/apps/{stack_name}/functions", get(routes::apps::get_app_functions))
        // Log endpoints
        .route("/api/logs/groups", get(routes::logs::list_log_groups))
        .route("/api/logs/events", get(routes::logs::get_logs))
        // WebSocket for real-time logs
        .route("/ws", get(routes::ws::ws_handler))
        .layer(cors)
        .with_state(clients);

    let addr = "0.0.0.0:3001";
    tracing::info!("Starting SST Monitor server on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

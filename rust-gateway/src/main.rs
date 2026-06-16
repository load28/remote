mod config;
mod error;
mod load_balancer;
mod proxy;
mod router;

use config::Config;
use load_balancer::LoadBalancer;
use proxy::AppState;
use router::create_router;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Load configuration
    let config = Config::from_env()?;

    info!("Starting Rust API Gateway");
    info!("Gateway address: {}", config.gateway_addr);
    info!("Backend servers: {:?}", config.backend_servers);

    // Create load balancer
    let load_balancer = LoadBalancer::new(config.backend_servers);

    // Create HTTP client for proxying
    let client = reqwest::Client::builder()
        .build()
        .expect("Failed to create HTTP client");

    // Create app state
    let state = AppState {
        load_balancer,
        client,
    };

    // Create router
    let app = create_router(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(&config.gateway_addr).await?;
    info!("Gateway listening on {}", config.gateway_addr);

    axum::serve(listener, app).await?;

    Ok(())
}

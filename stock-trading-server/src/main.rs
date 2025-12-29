mod api;
mod config;
mod db;
mod error;
mod middleware;
mod services;
mod websocket;

use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::api::AppState;
use crate::config::Config;
use crate::services::{AuthService, MarketService, PortfolioService, TradingService};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "stock_trading_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env();
    tracing::info!("Starting Stock Trading Server on {}", config.server_addr());

    // Initialize database
    let pool = db::init_db(&config).await?;
    tracing::info!("Database initialized successfully");

    // Initialize services
    let auth_service = Arc::new(AuthService::new(config.clone()));
    let market_service = Arc::new(MarketService::new(pool.clone()));
    let trading_service = Arc::new(TradingService::new(pool.clone()));
    let portfolio_service = Arc::new(PortfolioService::new(pool.clone()));

    // Start price simulation (for mock trading)
    market_service.clone().start_price_simulation();
    tracing::info!("Price simulation started");

    // Create application state
    let state = AppState {
        pool,
        config: config.clone(),
        auth_service,
        market_service,
        trading_service,
        portfolio_service,
    };

    // Create router
    let app = api::create_router(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(&config.server_addr()).await?;
    tracing::info!("Server listening on http://{}", config.server_addr());

    axum::serve(listener, app).await?;

    Ok(())
}

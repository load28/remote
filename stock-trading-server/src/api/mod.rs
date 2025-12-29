pub mod auth_routes;
pub mod market_routes;
pub mod portfolio_routes;
pub mod trading_routes;

use axum::{
    middleware,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::sync::Arc;
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use crate::config::Config;
use crate::db::DbPool;
use crate::middleware::auth_middleware;
use crate::services::{AuthService, MarketService, PortfolioService, TradingService};
use crate::websocket;

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

#[derive(Clone)]
pub struct AppState {
    pub pool: DbPool,
    pub config: Config,
    pub auth_service: Arc<AuthService>,
    pub market_service: Arc<MarketService>,
    pub trading_service: Arc<TradingService>,
    pub portfolio_service: Arc<PortfolioService>,
}

pub fn create_router(state: AppState) -> Router {
    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Auth state
    let auth_state = Arc::new(auth_routes::AuthState {
        pool: state.pool.clone(),
        auth_service: state.auth_service.clone(),
    });

    // Market state
    let market_state = Arc::new(market_routes::MarketState {
        market_service: state.market_service.clone(),
    });

    // Trading state
    let trading_state = Arc::new(trading_routes::TradingState {
        trading_service: state.trading_service.clone(),
    });

    // Portfolio state
    let portfolio_state = Arc::new(portfolio_routes::PortfolioState {
        portfolio_service: state.portfolio_service.clone(),
    });

    // WebSocket state
    let ws_state = Arc::new(websocket::WebSocketState {
        market_service: state.market_service.clone(),
    });

    // Protected routes (require authentication)
    let protected_routes = Router::new()
        .nest("/trading", trading_routes::routes(trading_state))
        .nest("/portfolio", portfolio_routes::routes(portfolio_state))
        .route_layer(middleware::from_fn_with_state(
            state.auth_service.clone(),
            auth_middleware,
        ));

    // Public routes
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .nest("/auth", auth_routes::routes(auth_state))
        .nest("/market", market_routes::routes(market_state));

    // WebSocket routes
    let ws_routes = websocket::routes(ws_state);

    // Combine all routes
    Router::new()
        .nest("/api/v1", public_routes)
        .nest("/api/v1", protected_routes)
        .nest("/ws", ws_routes)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

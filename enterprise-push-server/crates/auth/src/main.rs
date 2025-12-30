mod handlers;
mod oauth;
mod store;

use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use common::{AuthConfig, RedisConfig, ServiceConfig};
use common::auth::JwtService;

use crate::store::AuthStore;
use crate::oauth::OAuthProviders;

#[derive(Clone)]
pub struct AppState {
    pub jwt_service: Arc<JwtService>,
    pub store: Arc<AuthStore>,
    pub oauth_providers: Arc<OAuthProviders>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "auth_service=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let service_config = ServiceConfig::from_env("AUTH")?;
    let auth_config = AuthConfig::from_env()?;
    let redis_config = RedisConfig::from_env()?;

    tracing::info!("Starting Auth Service");
    tracing::info!("Service ID: {}", service_config.service_id);

    let jwt_service = Arc::new(JwtService::new(&auth_config));
    let store = Arc::new(AuthStore::new(&redis_config).await?);
    let oauth_providers = Arc::new(OAuthProviders::new(&auth_config)?);

    let state = AppState {
        jwt_service,
        store,
        oauth_providers,
    };

    let app = Router::new()
        // Health check
        .route("/health", get(|| async { "OK" }))
        // Auth endpoints
        .route("/auth/register", post(handlers::register))
        .route("/auth/login", post(handlers::login))
        .route("/auth/refresh", post(handlers::refresh_token))
        .route("/auth/logout", post(handlers::logout))
        .route("/auth/validate", post(handlers::validate_token))
        // OAuth endpoints
        .route("/oauth/google", get(handlers::oauth_google_redirect))
        .route("/oauth/google/callback", get(handlers::oauth_google_callback))
        .route("/oauth/github", get(handlers::oauth_github_redirect))
        .route("/oauth/github/callback", get(handlers::oauth_github_callback))
        // User info
        .route("/auth/me", get(handlers::get_current_user))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    let addr = format!("{}:{}", service_config.host, service_config.port);
    tracing::info!("Listening on {}", addr);

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

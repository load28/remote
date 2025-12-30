mod connection;
mod handler;
mod auth_client;

use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use common::{NatsConfig, RedisConfig, ServiceConfig, AuthConfig};
use common::bus::MessageBus;
use common::auth::JwtService;

use crate::connection::ConnectionManager;
use crate::auth_client::AuthClient;

#[derive(Clone)]
pub struct AppState {
    pub connection_manager: ConnectionManager,
    pub bus: Arc<MessageBus>,
    pub jwt_service: Arc<JwtService>,
    pub auth_client: Arc<AuthClient>,
    pub gateway_id: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "gateway_service=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let service_config = ServiceConfig::from_env("GATEWAY")?;
    let nats_config = NatsConfig::from_env()?;
    let auth_config = AuthConfig::from_env()?;

    tracing::info!("Starting Gateway Service");
    tracing::info!("Gateway ID: {}", service_config.service_id);

    let bus = Arc::new(MessageBus::new(&nats_config).await?);
    let jwt_service = Arc::new(JwtService::new(&auth_config));
    let auth_client = Arc::new(AuthClient::new());
    let connection_manager = ConnectionManager::new(service_config.service_id.clone());

    let state = AppState {
        connection_manager: connection_manager.clone(),
        bus: bus.clone(),
        jwt_service,
        auth_client,
        gateway_id: service_config.service_id.clone(),
    };

    // Start bus subscriber for incoming messages
    let bus_clone = bus.clone();
    let conn_manager_clone = connection_manager.clone();
    let gateway_id = service_config.service_id.clone();

    tokio::spawn(async move {
        if let Ok(mut rx) = bus_clone.subscribe_gateway(&gateway_id).await {
            while let Some(msg) = rx.recv().await {
                match msg {
                    common::bus::BusMessage::GatewayDeliver { user_id, message, .. } => {
                        let server_msg = common::ServerMessage {
                            msg_type: common::ServerMessageType::NewMessage,
                            payload: serde_json::to_value(&message).unwrap_or_default(),
                        };
                        conn_manager_clone.send_to_user(user_id, server_msg);
                    }
                    _ => {}
                }
            }
        }
    });

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/ws", get(handler::ws_handler))
        .route("/stats", get(handler::get_stats))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    let addr = format!("{}:{}", service_config.host, service_config.port);
    tracing::info!("Listening on {}", addr);

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

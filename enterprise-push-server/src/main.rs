use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

use enterprise_push_server::{
    bus::MessageBus,
    config::AppConfig,
    gateway::{ws_handler, GatewayState},
    message::MessageService,
    presence::PresenceService,
    push::{Platform, PushService},
    storage::StorageService,
};

#[derive(Clone)]
struct AppState {
    gateway: GatewayState,
    push_service: Arc<PushService>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "enterprise_push_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = AppConfig::from_env()?;
    tracing::info!("Starting Enterprise Push Server");
    tracing::info!("Gateway ID: {}", config.server.gateway_id);

    // Initialize storage
    let storage = Arc::new(
        StorageService::new(&config.redis, &config.scylla)
            .await
            .expect("Failed to initialize storage"),
    );

    // Initialize message bus
    let bus = Arc::new(
        MessageBus::new(&config.nats)
            .await
            .expect("Failed to connect to NATS"),
    );

    // Initialize push service
    let push_service = Arc::new(PushService::new(&config.push, storage.clone()));

    // Initialize presence service
    let presence_service = Arc::new(PresenceService::new(storage.clone(), bus.clone()));

    // Initialize message service
    let message_service = Arc::new(MessageService::new(
        storage.clone(),
        bus.clone(),
        push_service.clone(),
    ));

    // Create gateway state
    let gateway_state = GatewayState::new(
        config.server.gateway_id.clone(),
        message_service,
        presence_service,
    );

    let app_state = AppState {
        gateway: gateway_state.clone(),
        push_service,
    };

    // Start push notification worker
    let push_worker_bus = bus.clone();
    let push_worker_service = app_state.push_service.clone();
    tokio::spawn(async move {
        if let Ok(mut rx) = push_worker_bus.subscribe_push_notifications().await {
            while let Some((user_id, message)) = rx.recv().await {
                if let Err(e) = push_worker_service
                    .send_message_notification(&message, user_id)
                    .await
                {
                    tracing::error!(error = %e, user_id = %user_id, "Failed to send push notification");
                }
            }
        }
    });

    // Start gateway message subscriber
    let gateway_bus = bus.clone();
    let gateway_conn_manager = gateway_state.connection_manager.clone();
    let gateway_id = config.server.gateway_id.clone();
    tokio::spawn(async move {
        if let Ok(mut rx) = gateway_bus.subscribe_gateway(&gateway_id).await {
            while let Some((user_id, message)) = rx.recv().await {
                let server_msg = enterprise_push_server::gateway::ServerMessage {
                    msg_type: enterprise_push_server::gateway::ServerMessageType::NewMessage,
                    payload: serde_json::to_value(&message).unwrap_or_default(),
                };
                gateway_conn_manager.send_to_user(user_id, server_msg);
            }
        }
    });

    // Build router
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(health_check))
        .route("/stats", get(get_stats))
        .route("/device/register", post(register_device))
        .with_state(app_state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    tracing::info!("Listening on {}", addr);

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

#[derive(Debug, Serialize)]
struct Stats {
    connections: usize,
    users: usize,
    gateway_id: String,
}

async fn get_stats(State(state): State<AppState>) -> Json<Stats> {
    Json(Stats {
        connections: state.gateway.connection_manager.connection_count(),
        users: state.gateway.connection_manager.user_count(),
        gateway_id: state.gateway.gateway_id.clone(),
    })
}

#[derive(Debug, Deserialize)]
struct RegisterDeviceRequest {
    user_id: Uuid,
    device_id: String,
    token: String,
    platform: String,
}

#[derive(Debug, Serialize)]
struct RegisterDeviceResponse {
    success: bool,
    message: String,
}

async fn register_device(
    State(state): State<AppState>,
    Json(req): Json<RegisterDeviceRequest>,
) -> Result<Json<RegisterDeviceResponse>, StatusCode> {
    let platform = match req.platform.to_lowercase().as_str() {
        "android" => Platform::Android,
        "ios" => Platform::Ios,
        "web" => Platform::Web,
        _ => return Err(StatusCode::BAD_REQUEST),
    };

    match state
        .push_service
        .register_device_token(req.user_id, req.device_id, req.token, platform)
        .await
    {
        Ok(_) => Ok(Json(RegisterDeviceResponse {
            success: true,
            message: "Device registered successfully".to_string(),
        })),
        Err(e) => {
            tracing::error!(error = %e, "Failed to register device");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

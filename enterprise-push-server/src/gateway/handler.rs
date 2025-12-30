use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use super::{connection::handle_socket, ClientMessage, ConnectionManager};
use crate::message::MessageService;
use crate::presence::PresenceService;

#[derive(Clone)]
pub struct GatewayState {
    pub connection_manager: ConnectionManager,
    pub message_service: Arc<MessageService>,
    pub presence_service: Arc<PresenceService>,
    pub gateway_id: String,
}

impl GatewayState {
    pub fn new(
        gateway_id: String,
        message_service: Arc<MessageService>,
        presence_service: Arc<PresenceService>,
    ) -> Self {
        Self {
            connection_manager: ConnectionManager::new(gateway_id.clone()),
            message_service,
            presence_service,
            gateway_id,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    pub token: String,
    pub device_id: Option<String>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<GatewayState>,
) -> impl IntoResponse {
    // TODO: Validate JWT token and extract user_id
    // For now, we'll parse the token as a UUID for testing
    let user_id = match Uuid::parse_str(&query.token) {
        Ok(id) => id,
        Err(_) => {
            // In production, validate JWT here
            Uuid::new_v4()
        }
    };

    let device_id = query.device_id.unwrap_or_else(|| Uuid::new_v4().to_string());

    ws.on_upgrade(move |socket| handle_connection(socket, user_id, device_id, state))
}

async fn handle_connection(socket: WebSocket, user_id: Uuid, device_id: String, state: GatewayState) {
    tracing::info!(user_id = %user_id, device_id = %device_id, "New WebSocket connection");

    // Update presence
    let _ = state
        .presence_service
        .set_online(user_id, &device_id, &state.gateway_id)
        .await;

    // Create channel for incoming messages
    let (message_tx, mut message_rx) = mpsc::unbounded_channel::<(Uuid, String, ClientMessage)>();

    // Spawn message handler
    let message_service = state.message_service.clone();
    let presence_service = state.presence_service.clone();
    let conn_manager = state.connection_manager.clone();

    let handler = tokio::spawn(async move {
        while let Some((sender_id, device_id, msg)) = message_rx.recv().await {
            handle_client_message(
                sender_id,
                &device_id,
                msg,
                &message_service,
                &presence_service,
                &conn_manager,
            )
            .await;
        }
    });

    // Handle the socket
    handle_socket(
        socket,
        user_id,
        device_id.clone(),
        state.connection_manager.clone(),
        message_tx,
    )
    .await;

    // Update presence on disconnect
    let _ = state
        .presence_service
        .set_offline(user_id, &device_id)
        .await;

    handler.abort();
}

async fn handle_client_message(
    sender_id: Uuid,
    device_id: &str,
    msg: ClientMessage,
    message_service: &MessageService,
    presence_service: &PresenceService,
    conn_manager: &ConnectionManager,
) {
    use super::{ClientMessageType, ServerMessage, ServerMessageType};

    match msg.msg_type {
        ClientMessageType::SendMessage => {
            if let Ok(chat_msg) = serde_json::from_value::<super::ChatMessage>(msg.payload.clone()) {
                let _ = message_service.send_message(chat_msg).await;
            }
        }
        ClientMessageType::Typing => {
            if let Some(room_id) = msg.payload.get("room_id").and_then(|v| v.as_str()) {
                if let Ok(room_uuid) = Uuid::parse_str(room_id) {
                    let _ = presence_service.set_typing(sender_id, room_uuid).await;
                }
            }
        }
        ClientMessageType::StopTyping => {
            if let Some(room_id) = msg.payload.get("room_id").and_then(|v| v.as_str()) {
                if let Ok(room_uuid) = Uuid::parse_str(room_id) {
                    let _ = presence_service.clear_typing(sender_id, room_uuid).await;
                }
            }
        }
        ClientMessageType::Ack => {
            if let Some(message_id) = msg.payload.get("message_id").and_then(|v| v.as_str()) {
                if let Ok(msg_uuid) = Uuid::parse_str(message_id) {
                    let _ = message_service.acknowledge_message(sender_id, msg_uuid).await;
                }
            }
        }
        ClientMessageType::Ping => {
            let pong = ServerMessage {
                msg_type: ServerMessageType::Pong,
                payload: serde_json::json!({
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }),
            };
            conn_manager.send_to_user(sender_id, pong);
        }
    }
}

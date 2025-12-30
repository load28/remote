use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::{IntoResponse, Json},
};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use uuid::Uuid;

use common::{ClientMessage, ClientMessageType, ServerMessage, ServerMessageType, ChatMessage};
use common::bus::BusMessage;

use crate::connection::handle_socket;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    pub token: String,
    pub device_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Stats {
    pub connections: usize,
    pub users: usize,
    pub gateway_id: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    // Validate token with auth service or JWT
    let user_id = validate_token(&state, &query.token).await?;

    let device_id = query.device_id.unwrap_or_else(|| Uuid::new_v4().to_string());

    Ok(ws.on_upgrade(move |socket| handle_connection(socket, user_id, device_id, state)))
}

async fn validate_token(state: &AppState, token: &str) -> Result<Uuid, StatusCode> {
    // First try local JWT validation
    if let Ok(user_id) = state.jwt_service.extract_user_id(token) {
        return Ok(user_id);
    }

    // Fallback to auth service validation
    match state.auth_client.validate_token(token).await {
        Ok(Some(user_id)) => Ok(user_id),
        Ok(None) => Err(StatusCode::UNAUTHORIZED),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn handle_connection(
    socket: WebSocket,
    user_id: Uuid,
    device_id: String,
    state: AppState,
) {
    tracing::info!(user_id = %user_id, device_id = %device_id, "New WebSocket connection");

    // Notify presence service
    let _ = state.bus.update_presence(
        user_id,
        true,
        Some(state.gateway_id.clone()),
        Some(device_id.clone()),
    ).await;

    // Create channel for incoming messages
    let (message_tx, mut message_rx) = mpsc::unbounded_channel::<(Uuid, String, ClientMessage)>();

    // Spawn message handler
    let bus = state.bus.clone();
    let conn_manager = state.connection_manager.clone();

    let handler = tokio::spawn(async move {
        while let Some((sender_id, device_id, msg)) = message_rx.recv().await {
            handle_client_message(sender_id, &device_id, msg, &bus, &conn_manager).await;
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

    // Notify presence service about disconnect
    let _ = state.bus.update_presence(
        user_id,
        false,
        Some(state.gateway_id.clone()),
        Some(device_id),
    ).await;

    handler.abort();
}

async fn handle_client_message(
    sender_id: Uuid,
    device_id: &str,
    msg: ClientMessage,
    bus: &common::bus::MessageBus,
    conn_manager: &crate::connection::ConnectionManager,
) {
    match msg.msg_type {
        ClientMessageType::SendMessage => {
            if let Ok(mut chat_msg) = serde_json::from_value::<ChatMessage>(msg.payload.clone()) {
                chat_msg.id = Uuid::new_v4();
                chat_msg.sender_id = sender_id;
                chat_msg.timestamp = chrono::Utc::now();

                // Route through message service
                if let Some(recipient_id) = chat_msg.recipient_id {
                    let _ = bus.route_message(recipient_id, chat_msg).await;
                }
            }
        }
        ClientMessageType::Typing => {
            if let Some(room_id) = msg.payload.get("room_id").and_then(|v| v.as_str()) {
                if let Ok(room_uuid) = Uuid::parse_str(room_id) {
                    let _ = bus.update_typing(sender_id, room_uuid, true).await;
                }
            }
        }
        ClientMessageType::StopTyping => {
            if let Some(room_id) = msg.payload.get("room_id").and_then(|v| v.as_str()) {
                if let Ok(room_uuid) = Uuid::parse_str(room_id) {
                    let _ = bus.update_typing(sender_id, room_uuid, false).await;
                }
            }
        }
        ClientMessageType::Ack => {
            // Handle message acknowledgment
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

pub async fn get_stats(State(state): State<AppState>) -> Json<Stats> {
    Json(Stats {
        connections: state.connection_manager.connection_count(),
        users: state.connection_manager.user_count(),
        gateway_id: state.gateway_id.clone(),
    })
}

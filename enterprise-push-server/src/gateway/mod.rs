mod connection;
mod handler;

pub use connection::{Connection, ConnectionManager};
pub use handler::{ws_handler, GatewayState};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientMessage {
    #[serde(rename = "type")]
    pub msg_type: ClientMessageType,
    #[serde(flatten)]
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ClientMessageType {
    // Chat messages
    SendMessage,
    // Presence
    Typing,
    StopTyping,
    // Sync
    Ack,
    // Meta
    Ping,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerMessage {
    #[serde(rename = "type")]
    pub msg_type: ServerMessageType,
    #[serde(flatten)]
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServerMessageType {
    // Chat messages
    NewMessage,
    MessageDelivered,
    MessageRead,
    // Presence
    UserOnline,
    UserOffline,
    UserTyping,
    // System
    Error,
    Pong,
    Connected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub recipient_id: Option<Uuid>,
    pub room_id: Option<Uuid>,
    pub content: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

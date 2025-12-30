use axum::extract::ws::{Message, WebSocket};
use dashmap::DashMap;
use futures::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use common::{ClientMessage, ServerMessage, ServerMessageType};

pub struct Connection {
    pub user_id: Uuid,
    pub device_id: String,
    pub gateway_id: String,
    pub sender: mpsc::UnboundedSender<ServerMessage>,
    pub connected_at: chrono::DateTime<chrono::Utc>,
}

impl Connection {
    pub fn new(
        user_id: Uuid,
        device_id: String,
        gateway_id: String,
        sender: mpsc::UnboundedSender<ServerMessage>,
    ) -> Self {
        Self {
            user_id,
            device_id,
            gateway_id,
            sender,
            connected_at: chrono::Utc::now(),
        }
    }

    pub fn send(&self, message: ServerMessage) -> Result<(), mpsc::error::SendError<ServerMessage>> {
        self.sender.send(message)
    }
}

#[derive(Clone)]
pub struct ConnectionManager {
    connections: Arc<DashMap<Uuid, Vec<Connection>>>,
    gateway_id: String,
}

impl ConnectionManager {
    pub fn new(gateway_id: String) -> Self {
        Self {
            connections: Arc::new(DashMap::new()),
            gateway_id,
        }
    }

    pub fn add_connection(
        &self,
        user_id: Uuid,
        device_id: String,
        sender: mpsc::UnboundedSender<ServerMessage>,
    ) -> Connection {
        let connection = Connection::new(
            user_id,
            device_id.clone(),
            self.gateway_id.clone(),
            sender.clone(),
        );

        self.connections
            .entry(user_id)
            .or_insert_with(Vec::new)
            .push(Connection::new(
                user_id,
                device_id,
                self.gateway_id.clone(),
                sender,
            ));

        connection
    }

    pub fn remove_connection(&self, user_id: Uuid, device_id: &str) {
        if let Some(mut connections) = self.connections.get_mut(&user_id) {
            connections.retain(|c| c.device_id != device_id);
            if connections.is_empty() {
                drop(connections);
                self.connections.remove(&user_id);
            }
        }
    }

    pub fn send_to_user(&self, user_id: Uuid, message: ServerMessage) -> usize {
        let mut sent = 0;
        if let Some(connections) = self.connections.get(&user_id) {
            for conn in connections.iter() {
                if conn.send(message.clone()).is_ok() {
                    sent += 1;
                }
            }
        }
        sent
    }

    pub fn connection_count(&self) -> usize {
        self.connections
            .iter()
            .map(|entry| entry.value().len())
            .sum()
    }

    pub fn user_count(&self) -> usize {
        self.connections.len()
    }
}

pub async fn handle_socket(
    socket: WebSocket,
    user_id: Uuid,
    device_id: String,
    manager: ConnectionManager,
    message_tx: mpsc::UnboundedSender<(Uuid, String, ClientMessage)>,
) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

    let connection = manager.add_connection(user_id, device_id.clone(), tx);

    // Send connected message
    let connected_msg = ServerMessage {
        msg_type: ServerMessageType::Connected,
        payload: serde_json::json!({
            "user_id": user_id,
            "device_id": device_id,
            "gateway_id": connection.gateway_id,
        }),
    };
    let _ = connection.send(connected_msg);

    // Task to send messages to the client
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                if ws_sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Task to receive messages from the client
    let recv_device_id = device_id.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                        let _ = message_tx.send((user_id, recv_device_id.clone(), client_msg));
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    manager.remove_connection(user_id, &device_id);
    tracing::info!(user_id = %user_id, device_id = %device_id, "Connection closed");
}

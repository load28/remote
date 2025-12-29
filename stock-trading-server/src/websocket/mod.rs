use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
    routing::get,
    Router,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;

use crate::services::{market_service::PriceUpdate, MarketService};

pub struct WebSocketState {
    pub market_service: Arc<MarketService>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WsMessage {
    #[serde(rename = "subscribe")]
    Subscribe { symbols: Vec<String> },
    #[serde(rename = "unsubscribe")]
    Unsubscribe { symbols: Vec<String> },
    #[serde(rename = "price_update")]
    PriceUpdate(PriceUpdate),
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "connected")]
    Connected { message: String },
}

pub fn routes(state: Arc<WebSocketState>) -> Router {
    Router::new()
        .route("/prices", get(ws_handler))
        .with_state(state)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<WebSocketState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<WebSocketState>) {
    let (mut sender, mut receiver) = socket.split();

    // Send connected message
    let connected_msg = WsMessage::Connected {
        message: "Connected to stock trading WebSocket".to_string(),
    };
    if let Ok(json) = serde_json::to_string(&connected_msg) {
        let _ = sender.send(Message::Text(json)).await;
    }

    // Subscribe to price updates
    let mut price_rx = state.market_service.subscribe();

    // Track subscribed symbols
    let subscribed_symbols: Arc<tokio::sync::RwLock<Vec<String>>> =
        Arc::new(tokio::sync::RwLock::new(Vec::new()));

    let symbols_clone = subscribed_symbols.clone();

    // Spawn task to handle price updates
    let send_task = tokio::spawn(async move {
        while let Ok(update) = price_rx.recv().await {
            let symbols = symbols_clone.read().await;

            // Send update if subscribed to this symbol (or subscribed to all)
            if symbols.is_empty() || symbols.contains(&update.symbol) {
                let msg = WsMessage::PriceUpdate(update);
                if let Ok(json) = serde_json::to_string(&msg) {
                    if sender.send(Message::Text(json)).await.is_err() {
                        break;
                    }
                }
            }
        }
    });

    // Handle incoming messages
    let symbols_clone = subscribed_symbols.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                        match ws_msg {
                            WsMessage::Subscribe { symbols } => {
                                let mut subs = symbols_clone.write().await;
                                for symbol in symbols {
                                    if !subs.contains(&symbol) {
                                        subs.push(symbol);
                                    }
                                }
                                tracing::info!("Subscribed to: {:?}", *subs);
                            }
                            WsMessage::Unsubscribe { symbols } => {
                                let mut subs = symbols_clone.write().await;
                                subs.retain(|s| !symbols.contains(s));
                                tracing::info!("Unsubscribed, remaining: {:?}", *subs);
                            }
                            _ => {}
                        }
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    tracing::info!("WebSocket connection closed");
}

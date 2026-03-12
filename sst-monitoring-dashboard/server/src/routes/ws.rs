use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use std::time::Duration;

use crate::aws::{cloudwatch, AwsClients};
use crate::models::WsMessage;

/// WebSocket handler for real-time log streaming
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(clients): State<AwsClients>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, clients))
}

#[derive(serde::Deserialize)]
struct WsCommand {
    action: String,
    log_group: Option<String>,
}

async fn handle_socket(socket: WebSocket, clients: AwsClients) {
    let (mut sender, mut receiver) = socket.split();

    // Send welcome message
    let welcome = WsMessage {
        event: "connected".to_string(),
        data: serde_json::json!({"message": "Connected to SST Monitor"}),
    };
    let _ = sender
        .send(Message::Text(serde_json::to_string(&welcome).unwrap().into()))
        .await;

    // Shared state for the log tailing task
    let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(100);
    let (stop_tx, stop_rx) = tokio::sync::watch::channel(false);

    // Task to forward messages from channel to WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from client
    let clients_clone = clients.clone();
    let mut recv_task = tokio::spawn(async move {
        let mut tail_handle: Option<tokio::task::JoinHandle<()>> = None;

        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    let cmd: WsCommand = match serde_json::from_str(&text) {
                        Ok(cmd) => cmd,
                        Err(_) => continue,
                    };

                    match cmd.action.as_str() {
                        "subscribe" => {
                            // Stop existing tail if any
                            let _ = stop_tx.send(true);
                            if let Some(handle) = tail_handle.take() {
                                handle.abort();
                            }

                            // Reset stop signal
                            let _ = stop_tx.send(false);
                            let mut stop = stop_rx.clone();

                            if let Some(log_group) = cmd.log_group {
                                let tail_tx = tx.clone();
                                let clients = clients_clone.clone();
                                let log_group_for_ack = log_group.clone();

                                // Start tailing logs
                                tail_handle = Some(tokio::spawn(async move {
                                    let tx = tail_tx;
                                    let mut forward_token: Option<String> = None;

                                    loop {
                                        // Check if we should stop
                                        if *stop.borrow() {
                                            break;
                                        }

                                        match cloudwatch::tail_log_events(
                                            &clients.logs,
                                            &log_group,
                                            forward_token.as_deref(),
                                        )
                                        .await
                                        {
                                            Ok((events, new_token)) => {
                                                if !events.is_empty() {
                                                    let msg = WsMessage {
                                                        event: "logs".to_string(),
                                                        data: serde_json::to_value(&events)
                                                            .unwrap(),
                                                    };
                                                    if tx
                                                        .send(serde_json::to_string(&msg).unwrap())
                                                        .await
                                                        .is_err()
                                                    {
                                                        break;
                                                    }
                                                }
                                                forward_token = new_token;
                                            }
                                            Err(e) => {
                                                let msg = WsMessage {
                                                    event: "error".to_string(),
                                                    data: serde_json::json!({"message": e}),
                                                };
                                                let _ = tx
                                                    .send(serde_json::to_string(&msg).unwrap())
                                                    .await;
                                            }
                                        }

                                        // Poll interval - 1 second for near real-time
                                        tokio::select! {
                                            _ = tokio::time::sleep(Duration::from_secs(1)) => {},
                                            _ = stop.changed() => break,
                                        }
                                    }
                                }));

                                let ack = WsMessage {
                                    event: "subscribed".to_string(),
                                    data: serde_json::json!({"log_group": log_group_for_ack}),
                                };
                                let _ = tx.send(serde_json::to_string(&ack).unwrap()).await;
                            }
                        }
                        "unsubscribe" => {
                            let _ = stop_tx.send(true);
                            if let Some(handle) = tail_handle.take() {
                                handle.abort();
                            }
                        }
                        _ => {}
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }

        // Cleanup
        let _ = stop_tx.send(true);
        if let Some(handle) = tail_handle {
            handle.abort();
        }
    });

    // Wait for either task to finish, then abort the other
    tokio::select! {
        _ = &mut send_task => {
            recv_task.abort();
        },
        _ = &mut recv_task => {
            send_task.abort();
        },
    }
}

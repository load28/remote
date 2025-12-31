mod store;

#[cfg(test)]
mod tests;

use axum::{routing::get, Router};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use common::{NatsConfig, RedisConfig, ScyllaConfig, ServiceConfig};
use common::bus::{BusMessage, MessageBus};

use crate::store::MessageStore;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "message_service=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let service_config = ServiceConfig::from_env("MESSAGE")?;
    let nats_config = NatsConfig::from_env()?;
    let redis_config = RedisConfig::from_env()?;
    let scylla_config = ScyllaConfig::from_env()?;

    tracing::info!("Starting Message Service");
    tracing::info!("Service ID: {}", service_config.service_id);

    let bus = Arc::new(MessageBus::new(&nats_config).await?);
    let store = Arc::new(MessageStore::new(&redis_config, &scylla_config).await?);

    // Subscribe to message routing requests
    let bus_clone = bus.clone();
    let store_clone = store.clone();

    tokio::spawn(async move {
        // Subscribe to all message routing subjects
        if let Ok(mut rx) = bus_clone.subscribe("msg.route.>").await {
            while let Some(msg) = rx.recv().await {
                match msg {
                    BusMessage::RouteMessage { user_id, message } => {
                        tracing::debug!(user_id = %user_id, message_id = %message.id, "Routing message");

                        // Store message
                        if let Err(e) = store_clone.save_message(&message).await {
                            tracing::error!(error = %e, "Failed to save message");
                        }

                        // Check user presence and route
                        if let Ok(Some(presence)) = store_clone.get_user_presence(user_id).await {
                            if presence.is_online {
                                // Send to gateway
                                for device in &presence.devices {
                                    let _ = bus_clone
                                        .deliver_to_gateway(&device.gateway_id, user_id, message.clone())
                                        .await;
                                }
                            } else {
                                // Queue push notification
                                let _ = bus_clone.send_push_for_message(user_id, message.clone()).await;
                            }
                        } else {
                            // No presence info, send push
                            let _ = bus_clone.send_push_for_message(user_id, message.clone()).await;
                        }
                    }
                    _ => {}
                }
            }
        }
    });

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .layer(TraceLayer::new_for_http());

    let addr = format!("{}:{}", service_config.host, service_config.port);
    tracing::info!("Listening on {}", addr);

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

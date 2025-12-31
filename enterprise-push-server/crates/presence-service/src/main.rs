#[cfg(test)]
mod tests;

use axum::{routing::get, Router};
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

use common::{DevicePresence, NatsConfig, RedisConfig, ServiceConfig, UserPresence};
use common::bus::{BusMessage, MessageBus};

const PRESENCE_TTL: u64 = 300;

struct PresenceStore {
    redis: ConnectionManager,
}

impl PresenceStore {
    async fn new(config: &RedisConfig) -> anyhow::Result<Self> {
        let client = redis::Client::open(config.url.as_str())?;
        let redis = ConnectionManager::new(client).await?;
        Ok(Self { redis })
    }

    async fn set_online(
        &self,
        user_id: Uuid,
        device_id: &str,
        gateway_id: &str,
    ) -> anyhow::Result<bool> {
        let mut conn = self.redis.clone();
        let key = format!("presence:{}", user_id);

        let was_offline = !self.is_online(user_id).await?;

        let mut presence = self.get_presence(user_id).await?.unwrap_or_else(|| UserPresence {
            user_id,
            is_online: false,
            devices: Vec::new(),
            last_seen: chrono::Utc::now(),
        });

        presence.devices.retain(|d| d.device_id != device_id);
        presence.devices.push(DevicePresence {
            device_id: device_id.to_string(),
            gateway_id: gateway_id.to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        });
        presence.is_online = true;
        presence.last_seen = chrono::Utc::now();

        let data = serde_json::to_string(&presence)?;
        conn.set_ex(&key, &data, PRESENCE_TTL).await?;

        Ok(was_offline)
    }

    async fn set_offline(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<bool> {
        let mut conn = self.redis.clone();
        let key = format!("presence:{}", user_id);

        if let Some(mut presence) = self.get_presence(user_id).await? {
            presence.devices.retain(|d| d.device_id != device_id);
            presence.is_online = !presence.devices.is_empty();
            presence.last_seen = chrono::Utc::now();

            if presence.devices.is_empty() {
                conn.del(&key).await?;
                return Ok(true);
            } else {
                let data = serde_json::to_string(&presence)?;
                conn.set_ex(&key, &data, PRESENCE_TTL).await?;
            }
        }

        Ok(false)
    }

    async fn is_online(&self, user_id: Uuid) -> anyhow::Result<bool> {
        let mut conn = self.redis.clone();
        let key = format!("presence:{}", user_id);
        let exists: bool = conn.exists(&key).await?;
        Ok(exists)
    }

    async fn get_presence(&self, user_id: Uuid) -> anyhow::Result<Option<UserPresence>> {
        let mut conn = self.redis.clone();
        let key = format!("presence:{}", user_id);
        let data: Option<String> = conn.get(&key).await?;

        match data {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    async fn set_typing(&self, user_id: Uuid, room_id: Uuid, is_typing: bool) -> anyhow::Result<()> {
        let mut conn = self.redis.clone();
        let room_key = format!("room:{}:typing", room_id);
        let typing_key = format!("typing:{}:{}", room_id, user_id);

        if is_typing {
            conn.set_ex(&typing_key, "1", 10).await?;
            conn.sadd(&room_key, user_id.to_string()).await?;
        } else {
            conn.del(&typing_key).await?;
            conn.srem(&room_key, user_id.to_string()).await?;
        }

        Ok(())
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "presence_service=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let service_config = ServiceConfig::from_env("PRESENCE")?;
    let nats_config = NatsConfig::from_env()?;
    let redis_config = RedisConfig::from_env()?;

    tracing::info!("Starting Presence Service");
    tracing::info!("Service ID: {}", service_config.service_id);

    let bus = Arc::new(MessageBus::new(&nats_config).await?);
    let store = Arc::new(PresenceStore::new(&redis_config).await?);

    // Subscribe to presence updates
    let store_clone = store.clone();
    let bus_clone = bus.clone();

    tokio::spawn(async move {
        if let Ok(mut rx) = bus_clone.subscribe_presence_all().await {
            while let Some(msg) = rx.recv().await {
                match msg {
                    BusMessage::PresenceUpdate {
                        user_id,
                        is_online,
                        gateway_id,
                        device_id,
                    } => {
                        if is_online {
                            if let (Some(gw), Some(dev)) = (gateway_id, device_id) {
                                if let Err(e) = store_clone.set_online(user_id, &dev, &gw).await {
                                    tracing::error!(error = %e, "Failed to set user online");
                                }
                            }
                        } else {
                            if let Some(dev) = device_id {
                                if let Err(e) = store_clone.set_offline(user_id, &dev).await {
                                    tracing::error!(error = %e, "Failed to set user offline");
                                }
                            }
                        }
                    }
                    BusMessage::TypingUpdate {
                        user_id,
                        room_id,
                        is_typing,
                    } => {
                        if let Err(e) = store_clone.set_typing(user_id, room_id, is_typing).await {
                            tracing::error!(error = %e, "Failed to update typing status");
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

#[cfg(test)]
mod tests;

use axum::{routing::get, Router};
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

use common::{
    ChatMessage, DeviceToken, NatsConfig, Platform, PushNotification, PushPriority,
    PushProviderConfig, RedisConfig, ServiceConfig,
};
use common::bus::{BusMessage, MessageBus};

struct PushStore {
    redis: ConnectionManager,
}

impl PushStore {
    async fn new(config: &RedisConfig) -> anyhow::Result<Self> {
        let client = redis::Client::open(config.url.as_str())?;
        let redis = ConnectionManager::new(client).await?;
        Ok(Self { redis })
    }

    async fn get_device_tokens(&self, user_id: Uuid) -> anyhow::Result<Vec<DeviceToken>> {
        let mut conn = self.redis.clone();
        let key = format!("user:{}:tokens", user_id);
        let tokens: std::collections::HashMap<String, String> = conn.hgetall(&key).await?;

        let mut result = Vec::new();
        for (_, data) in tokens {
            if let Ok(token) = serde_json::from_str(&data) {
                result.push(token);
            }
        }
        Ok(result)
    }

    async fn remove_device_token(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        let mut conn = self.redis.clone();
        let key = format!("user:{}:tokens", user_id);
        conn.hdel(&key, device_id).await?;
        Ok(())
    }
}

struct FcmClient {
    client: Client,
    api_key: String,
}

#[derive(Debug, Serialize)]
struct FcmMessage {
    to: String,
    priority: String,
    notification: FcmNotification,
    data: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct FcmNotification {
    title: String,
    body: String,
    sound: String,
}

#[derive(Debug, Deserialize)]
struct FcmResponse {
    success: i32,
    failure: i32,
}

impl FcmClient {
    fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    async fn send(&self, token: &str, notification: &PushNotification) -> anyhow::Result<()> {
        let priority = match notification.priority {
            PushPriority::High => "high",
            _ => "normal",
        };

        let message = FcmMessage {
            to: token.to_string(),
            priority: priority.to_string(),
            notification: FcmNotification {
                title: notification.title.clone(),
                body: notification.body.clone(),
                sound: "default".to_string(),
            },
            data: notification.data.clone(),
        };

        let response = self
            .client
            .post("https://fcm.googleapis.com/fcm/send")
            .header("Authorization", format!("key={}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&message)
            .send()
            .await?;

        if !response.status().is_success() {
            anyhow::bail!("FCM request failed: {}", response.status());
        }

        Ok(())
    }
}

struct PushService {
    store: Arc<PushStore>,
    fcm: Option<FcmClient>,
}

impl PushService {
    fn new(store: Arc<PushStore>, config: &PushProviderConfig) -> Self {
        let fcm = config.fcm_api_key.as_ref().map(|key| FcmClient::new(key.clone()));
        Self { store, fcm }
    }

    async fn send_notification(&self, notification: PushNotification) -> anyhow::Result<()> {
        let tokens = self.store.get_device_tokens(notification.user_id).await?;

        for token in tokens {
            let result = match token.platform {
                Platform::Android | Platform::Web => {
                    if let Some(fcm) = &self.fcm {
                        fcm.send(&token.token, &notification).await
                    } else {
                        tracing::warn!("FCM not configured");
                        continue;
                    }
                }
                Platform::Ios => {
                    // APNs would be implemented here
                    tracing::warn!("APNs not implemented in this service");
                    continue;
                }
            };

            if let Err(e) = result {
                tracing::error!(
                    user_id = %notification.user_id,
                    device_id = %token.device_id,
                    error = %e,
                    "Failed to send push"
                );

                if e.to_string().to_lowercase().contains("invalid") {
                    let _ = self.store.remove_device_token(notification.user_id, &token.device_id).await;
                }
            }
        }

        Ok(())
    }

    async fn send_message_notification(&self, user_id: Uuid, message: &ChatMessage) -> anyhow::Result<()> {
        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id,
            title: "New Message".to_string(),
            body: truncate(&message.content, 100),
            data: serde_json::json!({
                "type": "new_message",
                "message_id": message.id,
                "sender_id": message.sender_id,
            }),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        self.send_notification(notification).await
    }
}

fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len - 3])
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "push_service=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let service_config = ServiceConfig::from_env("PUSH")?;
    let nats_config = NatsConfig::from_env()?;
    let redis_config = RedisConfig::from_env()?;
    let push_config = PushProviderConfig::from_env()?;

    tracing::info!("Starting Push Service");
    tracing::info!("Service ID: {}", service_config.service_id);

    let bus = Arc::new(MessageBus::new(&nats_config).await?);
    let store = Arc::new(PushStore::new(&redis_config).await?);
    let push_service = Arc::new(PushService::new(store, &push_config));

    // Subscribe to push requests
    let push_service_clone = push_service.clone();

    tokio::spawn(async move {
        if let Ok(mut rx) = bus.subscribe_push().await {
            while let Some(msg) = rx.recv().await {
                match msg {
                    BusMessage::SendPush { notification, .. } => {
                        if let Err(e) = push_service_clone.send_notification(notification).await {
                            tracing::error!(error = %e, "Failed to send push notification");
                        }
                    }
                    BusMessage::SendPushForMessage { user_id, message } => {
                        if let Err(e) = push_service_clone.send_message_notification(user_id, &message).await {
                            tracing::error!(error = %e, "Failed to send message push notification");
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

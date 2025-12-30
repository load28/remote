mod fcm;
mod apns;

pub use fcm::FcmClient;
pub use apns::ApnsClient;

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::config::PushConfig;
use crate::gateway::ChatMessage;
use crate::storage::StorageService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushNotification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub body: String,
    pub data: serde_json::Value,
    pub priority: PushPriority,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PushPriority {
    High,
    Normal,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceToken {
    pub user_id: Uuid,
    pub device_id: String,
    pub token: String,
    pub platform: Platform,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Android,
    Ios,
    Web,
}

pub struct PushService {
    fcm: Option<FcmClient>,
    apns: Option<ApnsClient>,
    storage: Arc<StorageService>,
}

impl PushService {
    pub fn new(config: &PushConfig, storage: Arc<StorageService>) -> Self {
        let fcm = config.fcm_api_key.as_ref().map(|key| FcmClient::new(key.clone()));

        let apns = if let (Some(key_path), Some(team_id), Some(key_id)) = (
            &config.apns_key_path,
            &config.apns_team_id,
            &config.apns_key_id,
        ) {
            ApnsClient::new(key_path, team_id, key_id).ok()
        } else {
            None
        };

        Self { fcm, apns, storage }
    }

    pub async fn send_notification(&self, notification: PushNotification) -> anyhow::Result<()> {
        // Get all device tokens for the user
        let tokens = self.storage.get_device_tokens(notification.user_id).await?;

        for token in tokens {
            let result = match token.platform {
                Platform::Android | Platform::Web => {
                    if let Some(fcm) = &self.fcm {
                        fcm.send(&token.token, &notification).await
                    } else {
                        tracing::warn!("FCM not configured, skipping push");
                        continue;
                    }
                }
                Platform::Ios => {
                    if let Some(apns) = &self.apns {
                        apns.send(&token.token, &notification).await
                    } else {
                        tracing::warn!("APNs not configured, skipping push");
                        continue;
                    }
                }
            };

            if let Err(e) = result {
                tracing::error!(
                    user_id = %notification.user_id,
                    device_id = %token.device_id,
                    error = %e,
                    "Failed to send push notification"
                );

                // Handle invalid tokens
                if Self::is_invalid_token_error(&e) {
                    let _ = self
                        .storage
                        .remove_device_token(notification.user_id, &token.device_id)
                        .await;
                }
            }
        }

        Ok(())
    }

    pub async fn send_message_notification(
        &self,
        message: &ChatMessage,
        recipient_id: Uuid,
    ) -> anyhow::Result<()> {
        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id: recipient_id,
            title: "New Message".to_string(),
            body: Self::truncate_message(&message.content, 100),
            data: serde_json::json!({
                "type": "new_message",
                "message_id": message.id,
                "sender_id": message.sender_id,
                "room_id": message.room_id,
            }),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        self.send_notification(notification).await
    }

    pub async fn register_device_token(
        &self,
        user_id: Uuid,
        device_id: String,
        token: String,
        platform: Platform,
    ) -> anyhow::Result<()> {
        let device_token = DeviceToken {
            user_id,
            device_id,
            token,
            platform,
            created_at: chrono::Utc::now(),
        };

        self.storage.save_device_token(device_token).await
    }

    fn truncate_message(content: &str, max_len: usize) -> String {
        if content.len() <= max_len {
            content.to_string()
        } else {
            format!("{}...", &content[..max_len - 3])
        }
    }

    fn is_invalid_token_error(error: &anyhow::Error) -> bool {
        let error_str = error.to_string().to_lowercase();
        error_str.contains("invalid") || error_str.contains("unregistered")
    }
}

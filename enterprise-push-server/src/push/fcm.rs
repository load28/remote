use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::{PushNotification, PushPriority};

const FCM_ENDPOINT: &str = "https://fcm.googleapis.com/fcm/send";

pub struct FcmClient {
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
    results: Option<Vec<FcmResult>>,
}

#[derive(Debug, Deserialize)]
struct FcmResult {
    message_id: Option<String>,
    error: Option<String>,
}

impl FcmClient {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    pub async fn send(&self, token: &str, notification: &PushNotification) -> anyhow::Result<()> {
        let priority = match notification.priority {
            PushPriority::High => "high",
            PushPriority::Normal => "normal",
            PushPriority::Low => "normal",
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
            .post(FCM_ENDPOINT)
            .header("Authorization", format!("key={}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&message)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("FCM request failed with status {}: {}", status, body);
        }

        let fcm_response: FcmResponse = response.json().await?;

        if fcm_response.failure > 0 {
            if let Some(results) = fcm_response.results {
                if let Some(result) = results.first() {
                    if let Some(error) = &result.error {
                        anyhow::bail!("FCM error: {}", error);
                    }
                }
            }
        }

        tracing::debug!(
            notification_id = %notification.id,
            success = fcm_response.success,
            "FCM notification sent"
        );

        Ok(())
    }

    pub async fn send_multicast(
        &self,
        tokens: &[String],
        notification: &PushNotification,
    ) -> anyhow::Result<Vec<Result<(), String>>> {
        let mut results = Vec::with_capacity(tokens.len());

        for token in tokens {
            match self.send(token, notification).await {
                Ok(_) => results.push(Ok(())),
                Err(e) => results.push(Err(e.to_string())),
            }
        }

        Ok(results)
    }
}

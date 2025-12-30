use reqwest::Client;
use serde::Serialize;

use super::{PushNotification, PushPriority};

const APNS_PRODUCTION_URL: &str = "https://api.push.apple.com";
const APNS_SANDBOX_URL: &str = "https://api.sandbox.push.apple.com";

pub struct ApnsClient {
    client: Client,
    team_id: String,
    key_id: String,
    #[allow(dead_code)]
    private_key: String,
    use_sandbox: bool,
}

#[derive(Debug, Serialize)]
struct ApnsPayload {
    aps: ApnsAps,
    #[serde(flatten)]
    data: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct ApnsAps {
    alert: ApnsAlert,
    sound: String,
    badge: Option<u32>,
    #[serde(rename = "content-available")]
    content_available: Option<u8>,
    #[serde(rename = "mutable-content")]
    mutable_content: Option<u8>,
}

#[derive(Debug, Serialize)]
struct ApnsAlert {
    title: String,
    body: String,
}

impl ApnsClient {
    pub fn new(key_path: &str, team_id: &str, key_id: &str) -> anyhow::Result<Self> {
        let private_key = std::fs::read_to_string(key_path)?;

        Ok(Self {
            client: Client::builder()
                .http2_prior_knowledge()
                .build()?,
            team_id: team_id.to_string(),
            key_id: key_id.to_string(),
            private_key,
            use_sandbox: std::env::var("APNS_USE_SANDBOX")
                .map(|v| v == "true" || v == "1")
                .unwrap_or(false),
        })
    }

    pub async fn send(&self, device_token: &str, notification: &PushNotification) -> anyhow::Result<()> {
        let base_url = if self.use_sandbox {
            APNS_SANDBOX_URL
        } else {
            APNS_PRODUCTION_URL
        };

        let url = format!("{}/3/device/{}", base_url, device_token);

        let payload = ApnsPayload {
            aps: ApnsAps {
                alert: ApnsAlert {
                    title: notification.title.clone(),
                    body: notification.body.clone(),
                },
                sound: "default".to_string(),
                badge: None,
                content_available: Some(1),
                mutable_content: Some(1),
            },
            data: notification.data.clone(),
        };

        let priority = match notification.priority {
            PushPriority::High => "10",
            PushPriority::Normal => "5",
            PushPriority::Low => "1",
        };

        let jwt_token = self.generate_jwt()?;

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("bearer {}", jwt_token))
            .header("apns-topic", self.get_bundle_id())
            .header("apns-priority", priority)
            .header("apns-push-type", "alert")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("APNs request failed with status {}: {}", status, body);
        }

        tracing::debug!(
            notification_id = %notification.id,
            device_token = %device_token,
            "APNs notification sent"
        );

        Ok(())
    }

    fn generate_jwt(&self) -> anyhow::Result<String> {
        use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
        use serde::Serialize;

        #[derive(Debug, Serialize)]
        struct Claims {
            iss: String,
            iat: i64,
        }

        let now = chrono::Utc::now().timestamp();

        let claims = Claims {
            iss: self.team_id.clone(),
            iat: now,
        };

        let mut header = Header::new(Algorithm::ES256);
        header.kid = Some(self.key_id.clone());

        let key = EncodingKey::from_ec_pem(self.private_key.as_bytes())?;
        let token = encode(&header, &claims, &key)?;

        Ok(token)
    }

    fn get_bundle_id(&self) -> String {
        std::env::var("APNS_BUNDLE_ID").unwrap_or_else(|_| "com.example.app".to_string())
    }
}

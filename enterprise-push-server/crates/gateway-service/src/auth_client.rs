use reqwest::Client;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

const AUTH_SERVICE_URL: &str = "AUTH_SERVICE_URL";

pub struct AuthClient {
    client: Client,
    base_url: String,
}

#[derive(Debug, Serialize)]
struct ValidateRequest {
    token: String,
}

#[derive(Debug, Deserialize)]
struct ValidateResponse {
    valid: bool,
    user_id: Option<Uuid>,
    email: Option<String>,
}

impl AuthClient {
    pub fn new() -> Self {
        let base_url = std::env::var(AUTH_SERVICE_URL)
            .unwrap_or_else(|_| "http://auth:8081".to_string());

        Self {
            client: Client::new(),
            base_url,
        }
    }

    pub async fn validate_token(&self, token: &str) -> anyhow::Result<Option<Uuid>> {
        let url = format!("{}/auth/validate", self.base_url);

        let response = self
            .client
            .post(&url)
            .json(&ValidateRequest {
                token: token.to_string(),
            })
            .send()
            .await?;

        if !response.status().is_success() {
            return Ok(None);
        }

        let validate_response: ValidateResponse = response.json().await?;

        if validate_response.valid {
            Ok(validate_response.user_id)
        } else {
            Ok(None)
        }
    }
}

impl Default for AuthClient {
    fn default() -> Self {
        Self::new()
    }
}

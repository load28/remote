use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct ServiceConfig {
    pub host: String,
    pub port: u16,
    pub service_id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
    pub pool_size: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NatsConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ScyllaConfig {
    pub nodes: Vec<String>,
    pub keyspace: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub jwt_expiry_hours: i64,
    pub refresh_expiry_days: i64,
    pub oauth_google_client_id: Option<String>,
    pub oauth_google_client_secret: Option<String>,
    pub oauth_github_client_id: Option<String>,
    pub oauth_github_client_secret: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PushProviderConfig {
    pub fcm_api_key: Option<String>,
    pub apns_key_path: Option<String>,
    pub apns_team_id: Option<String>,
    pub apns_key_id: Option<String>,
}

impl ServiceConfig {
    pub fn from_env(prefix: &str) -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            host: env::var(format!("{}_HOST", prefix))
                .unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var(format!("{}_PORT", prefix))
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
            service_id: env::var(format!("{}_ID", prefix))
                .unwrap_or_else(|_| uuid::Uuid::new_v4().to_string()),
        })
    }
}

impl RedisConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            url: env::var("REDIS_URL").unwrap_or_else(|_| "redis://redis:6379".to_string()),
            pool_size: env::var("REDIS_POOL_SIZE")
                .unwrap_or_else(|_| "10".to_string())
                .parse()?,
        })
    }
}

impl NatsConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            url: env::var("NATS_URL").unwrap_or_else(|_| "nats://nats:4222".to_string()),
        })
    }
}

impl ScyllaConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            nodes: env::var("SCYLLA_NODES")
                .unwrap_or_else(|_| "scylla:9042".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            keyspace: env::var("SCYLLA_KEYSPACE")
                .unwrap_or_else(|_| "push_server".to_string()),
        })
    }
}

impl AuthConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-super-secret-key-change-in-production".to_string()),
            jwt_expiry_hours: env::var("JWT_EXPIRY_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()?,
            refresh_expiry_days: env::var("REFRESH_EXPIRY_DAYS")
                .unwrap_or_else(|_| "30".to_string())
                .parse()?,
            oauth_google_client_id: env::var("OAUTH_GOOGLE_CLIENT_ID").ok(),
            oauth_google_client_secret: env::var("OAUTH_GOOGLE_CLIENT_SECRET").ok(),
            oauth_github_client_id: env::var("OAUTH_GITHUB_CLIENT_ID").ok(),
            oauth_github_client_secret: env::var("OAUTH_GITHUB_CLIENT_SECRET").ok(),
        })
    }
}

impl PushProviderConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            fcm_api_key: env::var("FCM_API_KEY").ok(),
            apns_key_path: env::var("APNS_KEY_PATH").ok(),
            apns_team_id: env::var("APNS_TEAM_ID").ok(),
            apns_key_id: env::var("APNS_KEY_ID").ok(),
        })
    }
}

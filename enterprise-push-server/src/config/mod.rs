use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub redis: RedisConfig,
    pub nats: NatsConfig,
    pub scylla: ScyllaConfig,
    pub push: PushConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub gateway_id: String,
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
pub struct PushConfig {
    pub fcm_api_key: Option<String>,
    pub apns_key_path: Option<String>,
    pub apns_team_id: Option<String>,
    pub apns_key_id: Option<String>,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            server: ServerConfig {
                host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("SERVER_PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()?,
                gateway_id: env::var("GATEWAY_ID")
                    .unwrap_or_else(|_| uuid::Uuid::new_v4().to_string()),
            },
            redis: RedisConfig {
                url: env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string()),
                pool_size: env::var("REDIS_POOL_SIZE")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()?,
            },
            nats: NatsConfig {
                url: env::var("NATS_URL").unwrap_or_else(|_| "nats://localhost:4222".to_string()),
            },
            scylla: ScyllaConfig {
                nodes: env::var("SCYLLA_NODES")
                    .unwrap_or_else(|_| "localhost:9042".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                keyspace: env::var("SCYLLA_KEYSPACE")
                    .unwrap_or_else(|_| "push_server".to_string()),
            },
            push: PushConfig {
                fcm_api_key: env::var("FCM_API_KEY").ok(),
                apns_key_path: env::var("APNS_KEY_PATH").ok(),
                apns_team_id: env::var("APNS_TEAM_ID").ok(),
                apns_key_id: env::var("APNS_KEY_ID").ok(),
            },
        })
    }
}

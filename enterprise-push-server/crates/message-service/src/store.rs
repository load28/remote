use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use uuid::Uuid;

use common::{ChatMessage, RedisConfig, ScyllaConfig, UserPresence};

pub struct MessageStore {
    redis: ConnectionManager,
}

impl MessageStore {
    pub async fn new(redis_config: &RedisConfig, _scylla_config: &ScyllaConfig) -> anyhow::Result<Self> {
        let client = redis::Client::open(redis_config.url.as_str())?;
        let redis = ConnectionManager::new(client).await?;
        Ok(Self { redis })
    }

    pub async fn save_message(&self, message: &ChatMessage) -> anyhow::Result<()> {
        let mut conn = self.redis.clone();
        let key = format!("message:{}", message.id);
        let data = serde_json::to_string(message)?;

        conn.set_ex(&key, &data, 86400 * 7).await?;

        if let Some(room_id) = message.room_id {
            conn.zadd(
                format!("room:{}:messages", room_id),
                message.id.to_string(),
                message.timestamp.timestamp_millis() as f64,
            )
            .await?;
        }

        Ok(())
    }

    pub async fn get_user_presence(&self, user_id: Uuid) -> anyhow::Result<Option<UserPresence>> {
        let mut conn = self.redis.clone();
        let key = format!("presence:{}", user_id);
        let data: Option<String> = conn.get(&key).await?;

        match data {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }
}

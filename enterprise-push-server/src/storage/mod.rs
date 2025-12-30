mod redis_store;
mod scylla_store;

pub use redis_store::RedisStore;
pub use scylla_store::ScyllaStore;

use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::config::{RedisConfig, ScyllaConfig};
use crate::gateway::ChatMessage;
use crate::presence::{DevicePresence, UserPresence};
use crate::push::DeviceToken;

pub struct StorageService {
    redis: RedisStore,
    scylla: Option<ScyllaStore>,
}

impl StorageService {
    pub async fn new(redis_config: &RedisConfig, scylla_config: &ScyllaConfig) -> anyhow::Result<Self> {
        let redis = RedisStore::new(redis_config).await?;

        // ScyllaDB is optional - fallback to Redis-only mode if not available
        let scylla = match ScyllaStore::new(scylla_config).await {
            Ok(store) => Some(store),
            Err(e) => {
                tracing::warn!("ScyllaDB not available, using Redis-only mode: {}", e);
                None
            }
        };

        Ok(Self { redis, scylla })
    }

    // Message operations
    pub async fn save_message(&self, message: &ChatMessage) -> anyhow::Result<()> {
        if let Some(scylla) = &self.scylla {
            scylla.save_message(message).await?;
        } else {
            self.redis.save_message(message).await?;
        }
        Ok(())
    }

    pub async fn get_message(&self, message_id: Uuid) -> anyhow::Result<Option<ChatMessage>> {
        if let Some(scylla) = &self.scylla {
            scylla.get_message(message_id).await
        } else {
            self.redis.get_message(message_id).await
        }
    }

    pub async fn get_room_messages(
        &self,
        room_id: Uuid,
        before: Option<chrono::DateTime<chrono::Utc>>,
        limit: usize,
    ) -> anyhow::Result<Vec<ChatMessage>> {
        if let Some(scylla) = &self.scylla {
            scylla.get_room_messages(room_id, before, limit).await
        } else {
            self.redis.get_room_messages(room_id, before, limit).await
        }
    }

    pub async fn get_undelivered_messages(&self, user_id: Uuid) -> anyhow::Result<Vec<ChatMessage>> {
        if let Some(scylla) = &self.scylla {
            scylla.get_undelivered_messages(user_id).await
        } else {
            self.redis.get_undelivered_messages(user_id).await
        }
    }

    pub async fn mark_message_delivered(&self, message_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        if let Some(scylla) = &self.scylla {
            scylla.mark_message_delivered(message_id, user_id).await
        } else {
            self.redis.mark_message_delivered(message_id, user_id).await
        }
    }

    pub async fn mark_message_read(&self, message_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        if let Some(scylla) = &self.scylla {
            scylla.mark_message_read(message_id, user_id).await
        } else {
            self.redis.mark_message_read(message_id, user_id).await
        }
    }

    // Room operations
    pub async fn get_room_members(&self, room_id: Uuid) -> anyhow::Result<Vec<Uuid>> {
        self.redis.get_room_members(room_id).await
    }

    pub async fn add_room_member(&self, room_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        self.redis.add_room_member(room_id, user_id).await
    }

    pub async fn remove_room_member(&self, room_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        self.redis.remove_room_member(room_id, user_id).await
    }

    // Presence operations
    pub async fn get_user_presence(&self, user_id: Uuid) -> anyhow::Result<Option<UserPresence>> {
        self.redis.get_user_presence(user_id).await
    }

    pub async fn get_users_presence(
        &self,
        user_ids: &[Uuid],
    ) -> anyhow::Result<HashMap<Uuid, UserPresence>> {
        self.redis.get_users_presence(user_ids).await
    }

    pub async fn add_device_presence(
        &self,
        user_id: Uuid,
        device: DevicePresence,
    ) -> anyhow::Result<()> {
        self.redis.add_device_presence(user_id, device).await
    }

    pub async fn remove_device_presence(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.redis.remove_device_presence(user_id, device_id).await
    }

    pub async fn update_device_activity(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.redis.update_device_activity(user_id, device_id).await
    }

    // Typing status
    pub async fn set_typing_status(
        &self,
        user_id: Uuid,
        room_id: Uuid,
        is_typing: bool,
    ) -> anyhow::Result<()> {
        self.redis.set_typing_status(user_id, room_id, is_typing).await
    }

    pub async fn get_typing_users(&self, room_id: Uuid) -> anyhow::Result<Vec<Uuid>> {
        self.redis.get_typing_users(room_id).await
    }

    // Device token operations
    pub async fn save_device_token(&self, token: DeviceToken) -> anyhow::Result<()> {
        self.redis.save_device_token(token).await
    }

    pub async fn get_device_tokens(&self, user_id: Uuid) -> anyhow::Result<Vec<DeviceToken>> {
        self.redis.get_device_tokens(user_id).await
    }

    pub async fn remove_device_token(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.redis.remove_device_token(user_id, device_id).await
    }
}

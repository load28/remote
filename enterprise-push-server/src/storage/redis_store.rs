use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use std::collections::HashMap;
use uuid::Uuid;

use crate::config::RedisConfig;
use crate::gateway::ChatMessage;
use crate::presence::{DevicePresence, UserPresence};
use crate::push::DeviceToken;

const PRESENCE_TTL: i64 = 300; // 5 minutes
const TYPING_TTL: i64 = 10; // 10 seconds
const MESSAGE_TTL: i64 = 86400 * 7; // 7 days

pub struct RedisStore {
    conn: ConnectionManager,
}

impl RedisStore {
    pub async fn new(config: &RedisConfig) -> anyhow::Result<Self> {
        let client = redis::Client::open(config.url.as_str())?;
        let conn = ConnectionManager::new(client).await?;
        Ok(Self { conn })
    }

    // Message operations
    pub async fn save_message(&self, message: &ChatMessage) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("message:{}", message.id);
        let data = serde_json::to_string(message)?;

        redis::pipe()
            .set_ex(&key, &data, MESSAGE_TTL as u64)
            .sadd(
                format!("room:{}:messages", message.room_id.unwrap_or(message.sender_id)),
                message.id.to_string(),
            )
            .sadd(
                format!("user:{}:undelivered", message.recipient_id.unwrap_or(message.sender_id)),
                message.id.to_string(),
            )
            .query_async(&mut conn)
            .await?;

        Ok(())
    }

    pub async fn get_message(&self, message_id: Uuid) -> anyhow::Result<Option<ChatMessage>> {
        let mut conn = self.conn.clone();
        let key = format!("message:{}", message_id);
        let data: Option<String> = conn.get(&key).await?;
        match data {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn get_room_messages(
        &self,
        room_id: Uuid,
        _before: Option<chrono::DateTime<chrono::Utc>>,
        limit: usize,
    ) -> anyhow::Result<Vec<ChatMessage>> {
        let mut conn = self.conn.clone();
        let key = format!("room:{}:messages", room_id);
        let message_ids: Vec<String> = conn.smembers(&key).await?;

        let mut messages = Vec::new();
        for id in message_ids.into_iter().take(limit) {
            if let Ok(uuid) = Uuid::parse_str(&id) {
                if let Some(msg) = self.get_message(uuid).await? {
                    messages.push(msg);
                }
            }
        }

        messages.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        Ok(messages)
    }

    pub async fn get_undelivered_messages(&self, user_id: Uuid) -> anyhow::Result<Vec<ChatMessage>> {
        let mut conn = self.conn.clone();
        let key = format!("user:{}:undelivered", user_id);
        let message_ids: Vec<String> = conn.smembers(&key).await?;

        let mut messages = Vec::new();
        for id in message_ids {
            if let Ok(uuid) = Uuid::parse_str(&id) {
                if let Some(msg) = self.get_message(uuid).await? {
                    messages.push(msg);
                }
            }
        }

        Ok(messages)
    }

    pub async fn mark_message_delivered(&self, message_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("user:{}:undelivered", user_id);
        conn.srem(&key, message_id.to_string()).await?;
        Ok(())
    }

    pub async fn mark_message_read(&self, message_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("message:{}:read_by", message_id);
        conn.sadd(&key, user_id.to_string()).await?;
        Ok(())
    }

    // Room operations
    pub async fn get_room_members(&self, room_id: Uuid) -> anyhow::Result<Vec<Uuid>> {
        let mut conn = self.conn.clone();
        let key = format!("room:{}:members", room_id);
        let members: Vec<String> = conn.smembers(&key).await?;

        Ok(members
            .into_iter()
            .filter_map(|s| Uuid::parse_str(&s).ok())
            .collect())
    }

    pub async fn add_room_member(&self, room_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("room:{}:members", room_id);
        conn.sadd(&key, user_id.to_string()).await?;
        Ok(())
    }

    pub async fn remove_room_member(&self, room_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("room:{}:members", room_id);
        conn.srem(&key, user_id.to_string()).await?;
        Ok(())
    }

    // Presence operations
    pub async fn get_user_presence(&self, user_id: Uuid) -> anyhow::Result<Option<UserPresence>> {
        let mut conn = self.conn.clone();
        let key = format!("presence:{}", user_id);
        let data: Option<String> = conn.get(&key).await?;
        match data {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn get_users_presence(
        &self,
        user_ids: &[Uuid],
    ) -> anyhow::Result<HashMap<Uuid, UserPresence>> {
        let mut result = HashMap::new();
        for user_id in user_ids {
            if let Some(presence) = self.get_user_presence(*user_id).await? {
                result.insert(*user_id, presence);
            }
        }
        Ok(result)
    }

    pub async fn add_device_presence(
        &self,
        user_id: Uuid,
        device: DevicePresence,
    ) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("presence:{}", user_id);

        let mut presence = self.get_user_presence(user_id).await?.unwrap_or_else(|| UserPresence {
            user_id,
            is_online: false,
            devices: Vec::new(),
            last_seen: chrono::Utc::now(),
        });

        // Remove existing device if present
        presence.devices.retain(|d| d.device_id != device.device_id);
        presence.devices.push(device);
        presence.is_online = true;
        presence.last_seen = chrono::Utc::now();

        let data = serde_json::to_string(&presence)?;
        conn.set_ex(&key, &data, PRESENCE_TTL as u64).await?;

        Ok(())
    }

    pub async fn remove_device_presence(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("presence:{}", user_id);

        if let Some(mut presence) = self.get_user_presence(user_id).await? {
            presence.devices.retain(|d| d.device_id != device_id);
            presence.is_online = !presence.devices.is_empty();
            presence.last_seen = chrono::Utc::now();

            if presence.devices.is_empty() {
                conn.del(&key).await?;
            } else {
                let data = serde_json::to_string(&presence)?;
                conn.set_ex(&key, &data, PRESENCE_TTL as u64).await?;
            }
        }

        Ok(())
    }

    pub async fn update_device_activity(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("presence:{}", user_id);

        if let Some(mut presence) = self.get_user_presence(user_id).await? {
            for device in &mut presence.devices {
                if device.device_id == device_id {
                    device.last_activity = chrono::Utc::now();
                    break;
                }
            }
            presence.last_seen = chrono::Utc::now();

            let data = serde_json::to_string(&presence)?;
            conn.set_ex(&key, &data, PRESENCE_TTL as u64).await?;
        }

        Ok(())
    }

    // Typing status
    pub async fn set_typing_status(
        &self,
        user_id: Uuid,
        room_id: Uuid,
        is_typing: bool,
    ) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("room:{}:typing", room_id);

        if is_typing {
            let member_key = format!("{}:{}", user_id, chrono::Utc::now().timestamp());
            conn.set_ex(&format!("typing:{}:{}", room_id, user_id), "1", TYPING_TTL as u64).await?;
            conn.sadd(&key, user_id.to_string()).await?;
        } else {
            conn.del(&format!("typing:{}:{}", room_id, user_id)).await?;
            conn.srem(&key, user_id.to_string()).await?;
        }

        Ok(())
    }

    pub async fn get_typing_users(&self, room_id: Uuid) -> anyhow::Result<Vec<Uuid>> {
        let mut conn = self.conn.clone();
        let key = format!("room:{}:typing", room_id);
        let users: Vec<String> = conn.smembers(&key).await?;

        let mut result = Vec::new();
        for user_str in users {
            if let Ok(user_id) = Uuid::parse_str(&user_str) {
                // Check if typing status is still valid
                let typing_key = format!("typing:{}:{}", room_id, user_id);
                let exists: bool = conn.exists(&typing_key).await?;
                if exists {
                    result.push(user_id);
                } else {
                    // Clean up stale entry
                    conn.srem(&key, user_str).await?;
                }
            }
        }

        Ok(result)
    }

    // Device token operations
    pub async fn save_device_token(&self, token: DeviceToken) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("user:{}:tokens", token.user_id);
        let data = serde_json::to_string(&token)?;
        conn.hset(&key, &token.device_id, &data).await?;
        Ok(())
    }

    pub async fn get_device_tokens(&self, user_id: Uuid) -> anyhow::Result<Vec<DeviceToken>> {
        let mut conn = self.conn.clone();
        let key = format!("user:{}:tokens", user_id);
        let tokens: HashMap<String, String> = conn.hgetall(&key).await?;

        let mut result = Vec::new();
        for (_, data) in tokens {
            if let Ok(token) = serde_json::from_str(&data) {
                result.push(token);
            }
        }

        Ok(result)
    }

    pub async fn remove_device_token(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        let mut conn = self.conn.clone();
        let key = format!("user:{}:tokens", user_id);
        conn.hdel(&key, device_id).await?;
        Ok(())
    }
}

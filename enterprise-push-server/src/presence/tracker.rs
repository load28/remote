use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use super::{DevicePresence, UserPresence};
use crate::storage::StorageService;

pub struct PresenceTracker {
    storage: Arc<StorageService>,
}

impl PresenceTracker {
    pub fn new(storage: Arc<StorageService>) -> Self {
        Self { storage }
    }

    pub async fn add_device(
        &self,
        user_id: Uuid,
        device_id: &str,
        gateway_id: &str,
    ) -> anyhow::Result<()> {
        let device = DevicePresence {
            device_id: device_id.to_string(),
            gateway_id: gateway_id.to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        };

        self.storage.add_device_presence(user_id, device).await
    }

    pub async fn remove_device(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.storage.remove_device_presence(user_id, device_id).await
    }

    pub async fn is_online(&self, user_id: Uuid) -> bool {
        self.storage
            .get_user_presence(user_id)
            .await
            .ok()
            .flatten()
            .map(|p| p.is_online)
            .unwrap_or(false)
    }

    pub async fn get_presence(&self, user_id: Uuid) -> anyhow::Result<Option<UserPresence>> {
        self.storage.get_user_presence(user_id).await
    }

    pub async fn get_bulk_presence(
        &self,
        user_ids: &[Uuid],
    ) -> anyhow::Result<HashMap<Uuid, UserPresence>> {
        self.storage.get_users_presence(user_ids).await
    }

    pub async fn set_typing(&self, user_id: Uuid, room_id: Uuid) -> anyhow::Result<()> {
        self.storage.set_typing_status(user_id, room_id, true).await
    }

    pub async fn clear_typing(&self, user_id: Uuid, room_id: Uuid) -> anyhow::Result<()> {
        self.storage.set_typing_status(user_id, room_id, false).await
    }

    pub async fn get_typing_users(&self, room_id: Uuid) -> anyhow::Result<Vec<Uuid>> {
        self.storage.get_typing_users(room_id).await
    }

    pub async fn update_activity(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.storage.update_device_activity(user_id, device_id).await
    }
}

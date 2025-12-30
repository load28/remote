mod tracker;

pub use tracker::PresenceTracker;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::bus::MessageBus;
use crate::storage::StorageService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPresence {
    pub user_id: Uuid,
    pub is_online: bool,
    pub devices: Vec<DevicePresence>,
    pub last_seen: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevicePresence {
    pub device_id: String,
    pub gateway_id: String,
    pub connected_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypingStatus {
    pub user_id: Uuid,
    pub room_id: Uuid,
    pub started_at: chrono::DateTime<chrono::Utc>,
}

pub struct PresenceService {
    storage: Arc<StorageService>,
    bus: Arc<MessageBus>,
    tracker: PresenceTracker,
}

impl PresenceService {
    pub fn new(storage: Arc<StorageService>, bus: Arc<MessageBus>) -> Self {
        Self {
            storage: storage.clone(),
            bus: bus.clone(),
            tracker: PresenceTracker::new(storage),
        }
    }

    pub async fn set_online(
        &self,
        user_id: Uuid,
        device_id: &str,
        gateway_id: &str,
    ) -> anyhow::Result<()> {
        let was_offline = !self.tracker.is_online(user_id).await;

        self.tracker.add_device(user_id, device_id, gateway_id).await?;

        // Broadcast online status if user just came online
        if was_offline {
            self.bus.publish_presence_change(user_id, true).await?;
        }

        Ok(())
    }

    pub async fn set_offline(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.tracker.remove_device(user_id, device_id).await?;

        // Check if user has no more active devices
        if !self.tracker.is_online(user_id).await {
            self.bus.publish_presence_change(user_id, false).await?;
        }

        Ok(())
    }

    pub async fn get_presence(&self, user_id: Uuid) -> anyhow::Result<Option<UserPresence>> {
        self.tracker.get_presence(user_id).await
    }

    pub async fn get_bulk_presence(
        &self,
        user_ids: &[Uuid],
    ) -> anyhow::Result<HashMap<Uuid, UserPresence>> {
        self.tracker.get_bulk_presence(user_ids).await
    }

    pub async fn set_typing(&self, user_id: Uuid, room_id: Uuid) -> anyhow::Result<()> {
        self.tracker.set_typing(user_id, room_id).await?;
        self.bus.publish_typing(user_id, room_id, true).await?;
        Ok(())
    }

    pub async fn clear_typing(&self, user_id: Uuid, room_id: Uuid) -> anyhow::Result<()> {
        self.tracker.clear_typing(user_id, room_id).await?;
        self.bus.publish_typing(user_id, room_id, false).await?;
        Ok(())
    }

    pub async fn get_typing_users(&self, room_id: Uuid) -> anyhow::Result<Vec<Uuid>> {
        self.tracker.get_typing_users(room_id).await
    }

    pub async fn heartbeat(&self, user_id: Uuid, device_id: &str) -> anyhow::Result<()> {
        self.tracker.update_activity(user_id, device_id).await
    }

    pub async fn find_user_gateway(&self, user_id: Uuid) -> anyhow::Result<Option<String>> {
        if let Some(presence) = self.tracker.get_presence(user_id).await? {
            if let Some(device) = presence.devices.first() {
                return Ok(Some(device.gateway_id.clone()));
            }
        }
        Ok(None)
    }
}

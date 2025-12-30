use std::sync::Arc;
use uuid::Uuid;

use crate::bus::MessageBus;
use crate::gateway::ChatMessage;
use crate::push::PushService;
use crate::storage::StorageService;

pub struct FanoutService {
    storage: Arc<StorageService>,
    bus: Arc<MessageBus>,
    push_service: Arc<PushService>,
}

impl FanoutService {
    pub fn new(
        storage: Arc<StorageService>,
        bus: Arc<MessageBus>,
        push_service: Arc<PushService>,
    ) -> Self {
        Self {
            storage,
            bus,
            push_service,
        }
    }

    pub async fn fanout_to_room(&self, message: &ChatMessage, room_id: Uuid) -> anyhow::Result<()> {
        // Get all members of the room
        let members = self.storage.get_room_members(room_id).await?;

        // Get presence info for all members
        let presences = self.storage.get_users_presence(&members).await?;

        let mut online_users = Vec::new();
        let mut offline_users = Vec::new();

        for member_id in members {
            // Skip the sender
            if member_id == message.sender_id {
                continue;
            }

            if let Some(presence) = presences.get(&member_id) {
                if presence.is_online {
                    online_users.push(member_id);
                } else {
                    offline_users.push(member_id);
                }
            } else {
                offline_users.push(member_id);
            }
        }

        // Publish to online users via message bus
        for user_id in online_users {
            self.bus.publish_message(user_id, message.clone()).await?;
        }

        // Queue push notifications for offline users
        for user_id in offline_users {
            self.bus.queue_push_notification(user_id, message.clone()).await?;
        }

        Ok(())
    }

    pub async fn fanout_to_users(
        &self,
        message: &ChatMessage,
        user_ids: Vec<Uuid>,
    ) -> anyhow::Result<()> {
        for user_id in user_ids {
            if user_id != message.sender_id {
                self.bus.publish_message(user_id, message.clone()).await?;
            }
        }
        Ok(())
    }
}

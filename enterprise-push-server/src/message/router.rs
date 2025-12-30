use std::sync::Arc;
use uuid::Uuid;

use crate::bus::MessageBus;
use crate::gateway::ChatMessage;
use crate::storage::StorageService;

pub struct MessageRouter {
    storage: Arc<StorageService>,
    bus: Arc<MessageBus>,
}

impl MessageRouter {
    pub fn new(storage: Arc<StorageService>, bus: Arc<MessageBus>) -> Self {
        Self { storage, bus }
    }

    pub async fn route_direct_message(
        &self,
        message: &ChatMessage,
        recipient_id: Uuid,
    ) -> anyhow::Result<()> {
        // Check if recipient is online
        let presence = self.storage.get_user_presence(recipient_id).await?;

        if let Some(presence) = presence {
            if presence.is_online {
                // User is online - route through message bus
                self.bus.publish_message(recipient_id, message.clone()).await?;
            } else {
                // User is offline - queue for push notification
                self.bus.queue_push_notification(recipient_id, message.clone()).await?;
            }
        } else {
            // No presence info - try both paths
            self.bus.publish_message(recipient_id, message.clone()).await?;
            self.bus.queue_push_notification(recipient_id, message.clone()).await?;
        }

        Ok(())
    }

    pub async fn route_to_gateway(
        &self,
        gateway_id: &str,
        user_id: Uuid,
        message: &ChatMessage,
    ) -> anyhow::Result<()> {
        self.bus.publish_to_gateway(gateway_id, user_id, message.clone()).await
    }
}

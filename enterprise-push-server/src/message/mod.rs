mod router;
mod fanout;

pub use router::MessageRouter;
pub use fanout::FanoutService;

use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::gateway::ChatMessage;
use crate::storage::StorageService;
use crate::bus::MessageBus;
use crate::push::PushService;

pub struct MessageService {
    storage: Arc<StorageService>,
    bus: Arc<MessageBus>,
    push_service: Arc<PushService>,
    router: MessageRouter,
    fanout: FanoutService,
}

impl MessageService {
    pub fn new(
        storage: Arc<StorageService>,
        bus: Arc<MessageBus>,
        push_service: Arc<PushService>,
    ) -> Self {
        Self {
            storage: storage.clone(),
            bus: bus.clone(),
            push_service: push_service.clone(),
            router: MessageRouter::new(storage.clone(), bus.clone()),
            fanout: FanoutService::new(storage, bus, push_service),
        }
    }

    pub async fn send_message(&self, message: ChatMessage) -> anyhow::Result<()> {
        // 1. Store message in database
        self.storage.save_message(&message).await?;

        // 2. Route to recipient(s)
        if let Some(recipient_id) = message.recipient_id {
            // 1:1 message
            self.router.route_direct_message(&message, recipient_id).await?;
        } else if let Some(room_id) = message.room_id {
            // Group message - fanout to all members
            self.fanout.fanout_to_room(&message, room_id).await?;
        }

        Ok(())
    }

    pub async fn acknowledge_message(&self, user_id: Uuid, message_id: Uuid) -> anyhow::Result<()> {
        self.storage.mark_message_delivered(message_id, user_id).await?;

        // Notify sender about delivery
        if let Some(message) = self.storage.get_message(message_id).await? {
            self.bus.publish_delivery_receipt(message.sender_id, message_id).await?;
        }

        Ok(())
    }

    pub async fn mark_as_read(&self, user_id: Uuid, message_ids: Vec<Uuid>) -> anyhow::Result<()> {
        for message_id in message_ids {
            self.storage.mark_message_read(message_id, user_id).await?;

            if let Some(message) = self.storage.get_message(message_id).await? {
                self.bus.publish_read_receipt(message.sender_id, message_id).await?;
            }
        }
        Ok(())
    }

    pub async fn get_message_history(
        &self,
        room_id: Uuid,
        before: Option<chrono::DateTime<chrono::Utc>>,
        limit: usize,
    ) -> anyhow::Result<Vec<ChatMessage>> {
        self.storage.get_room_messages(room_id, before, limit).await
    }

    pub async fn get_undelivered_messages(&self, user_id: Uuid) -> anyhow::Result<Vec<ChatMessage>> {
        self.storage.get_undelivered_messages(user_id).await
    }
}

#[derive(Debug, Clone)]
pub struct DeliveryStatus {
    pub message_id: Uuid,
    pub recipient_id: Uuid,
    pub status: DeliveryState,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DeliveryState {
    Pending,
    Sent,
    Delivered,
    Read,
    Failed,
}

use async_nats::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::config::NatsConfig;
use crate::gateway::ChatMessage;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BusMessage {
    // Direct message to user
    Message {
        user_id: Uuid,
        message: ChatMessage,
    },
    // Message to specific gateway
    GatewayMessage {
        gateway_id: String,
        user_id: Uuid,
        message: ChatMessage,
    },
    // Push notification request
    PushRequest {
        user_id: Uuid,
        message: ChatMessage,
    },
    // Presence change
    PresenceChange {
        user_id: Uuid,
        is_online: bool,
    },
    // Typing indicator
    Typing {
        user_id: Uuid,
        room_id: Uuid,
        is_typing: bool,
    },
    // Delivery receipt
    DeliveryReceipt {
        sender_id: Uuid,
        message_id: Uuid,
    },
    // Read receipt
    ReadReceipt {
        sender_id: Uuid,
        message_id: Uuid,
    },
}

pub struct MessageBus {
    client: Client,
}

impl MessageBus {
    pub async fn new(config: &NatsConfig) -> anyhow::Result<Self> {
        let client = async_nats::connect(&config.url).await?;
        Ok(Self { client })
    }

    pub async fn publish_message(&self, user_id: Uuid, message: ChatMessage) -> anyhow::Result<()> {
        let bus_msg = BusMessage::Message { user_id, message };
        let subject = format!("messages.user.{}", user_id);
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_to_gateway(
        &self,
        gateway_id: &str,
        user_id: Uuid,
        message: ChatMessage,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::GatewayMessage {
            gateway_id: gateway_id.to_string(),
            user_id,
            message,
        };
        let subject = format!("gateway.{}", gateway_id);
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn queue_push_notification(
        &self,
        user_id: Uuid,
        message: ChatMessage,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::PushRequest { user_id, message };
        let subject = "push.notifications";
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_presence_change(&self, user_id: Uuid, is_online: bool) -> anyhow::Result<()> {
        let bus_msg = BusMessage::PresenceChange { user_id, is_online };
        let subject = format!("presence.{}", user_id);
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_typing(
        &self,
        user_id: Uuid,
        room_id: Uuid,
        is_typing: bool,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::Typing {
            user_id,
            room_id,
            is_typing,
        };
        let subject = format!("typing.room.{}", room_id);
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_delivery_receipt(
        &self,
        sender_id: Uuid,
        message_id: Uuid,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::DeliveryReceipt {
            sender_id,
            message_id,
        };
        let subject = format!("receipts.{}", sender_id);
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_read_receipt(&self, sender_id: Uuid, message_id: Uuid) -> anyhow::Result<()> {
        let bus_msg = BusMessage::ReadReceipt {
            sender_id,
            message_id,
        };
        let subject = format!("receipts.{}", sender_id);
        let payload = serde_json::to_vec(&bus_msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn subscribe_user_messages(
        &self,
        user_id: Uuid,
    ) -> anyhow::Result<mpsc::UnboundedReceiver<ChatMessage>> {
        let (tx, rx) = mpsc::unbounded_channel();
        let subject = format!("messages.user.{}", user_id);
        let mut subscriber = self.client.subscribe(subject).await?;

        tokio::spawn(async move {
            while let Some(msg) = subscriber.next().await {
                if let Ok(bus_msg) = serde_json::from_slice::<BusMessage>(&msg.payload) {
                    if let BusMessage::Message { message, .. } = bus_msg {
                        if tx.send(message).is_err() {
                            break;
                        }
                    }
                }
            }
        });

        Ok(rx)
    }

    pub async fn subscribe_gateway(
        &self,
        gateway_id: &str,
    ) -> anyhow::Result<mpsc::UnboundedReceiver<(Uuid, ChatMessage)>> {
        let (tx, rx) = mpsc::unbounded_channel();
        let subject = format!("gateway.{}", gateway_id);
        let mut subscriber = self.client.subscribe(subject).await?;

        tokio::spawn(async move {
            while let Some(msg) = subscriber.next().await {
                if let Ok(bus_msg) = serde_json::from_slice::<BusMessage>(&msg.payload) {
                    if let BusMessage::GatewayMessage {
                        user_id, message, ..
                    } = bus_msg
                    {
                        if tx.send((user_id, message)).is_err() {
                            break;
                        }
                    }
                }
            }
        });

        Ok(rx)
    }

    pub async fn subscribe_push_notifications(
        &self,
    ) -> anyhow::Result<mpsc::UnboundedReceiver<(Uuid, ChatMessage)>> {
        let (tx, rx) = mpsc::unbounded_channel();
        let mut subscriber = self.client.subscribe("push.notifications").await?;

        tokio::spawn(async move {
            while let Some(msg) = subscriber.next().await {
                if let Ok(bus_msg) = serde_json::from_slice::<BusMessage>(&msg.payload) {
                    if let BusMessage::PushRequest { user_id, message } = bus_msg {
                        if tx.send((user_id, message)).is_err() {
                            break;
                        }
                    }
                }
            }
        });

        Ok(rx)
    }
}

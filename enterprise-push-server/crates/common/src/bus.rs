use async_nats::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::types::{ChatMessage, PushNotification};
use crate::config::NatsConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BusMessage {
    // Message routing
    RouteMessage {
        user_id: Uuid,
        message: ChatMessage,
    },
    GatewayDeliver {
        gateway_id: String,
        user_id: Uuid,
        message: ChatMessage,
    },
    // Push notifications
    SendPush {
        user_id: Uuid,
        notification: PushNotification,
    },
    SendPushForMessage {
        user_id: Uuid,
        message: ChatMessage,
    },
    // Presence
    PresenceUpdate {
        user_id: Uuid,
        is_online: bool,
        gateway_id: Option<String>,
        device_id: Option<String>,
    },
    TypingUpdate {
        user_id: Uuid,
        room_id: Uuid,
        is_typing: bool,
    },
    // Receipts
    DeliveryReceipt {
        sender_id: Uuid,
        message_id: Uuid,
    },
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

    pub async fn publish(&self, subject: &str, message: &BusMessage) -> anyhow::Result<()> {
        let payload = serde_json::to_vec(message)?;
        self.client.publish(subject.to_string(), payload.into()).await?;
        Ok(())
    }

    // Subject patterns
    pub fn subject_message_route(user_id: Uuid) -> String {
        format!("msg.route.{}", user_id)
    }

    pub fn subject_gateway(gateway_id: &str) -> String {
        format!("gateway.{}", gateway_id)
    }

    pub fn subject_push() -> String {
        "push.send".to_string()
    }

    pub fn subject_presence(user_id: Uuid) -> String {
        format!("presence.{}", user_id)
    }

    pub fn subject_typing(room_id: Uuid) -> String {
        format!("typing.{}", room_id)
    }

    // Publish helpers
    pub async fn route_message(&self, user_id: Uuid, message: ChatMessage) -> anyhow::Result<()> {
        let bus_msg = BusMessage::RouteMessage { user_id, message };
        self.publish(&Self::subject_message_route(user_id), &bus_msg).await
    }

    pub async fn deliver_to_gateway(
        &self,
        gateway_id: &str,
        user_id: Uuid,
        message: ChatMessage,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::GatewayDeliver {
            gateway_id: gateway_id.to_string(),
            user_id,
            message,
        };
        self.publish(&Self::subject_gateway(gateway_id), &bus_msg).await
    }

    pub async fn send_push(&self, user_id: Uuid, notification: PushNotification) -> anyhow::Result<()> {
        let bus_msg = BusMessage::SendPush { user_id, notification };
        self.publish(&Self::subject_push(), &bus_msg).await
    }

    pub async fn send_push_for_message(&self, user_id: Uuid, message: ChatMessage) -> anyhow::Result<()> {
        let bus_msg = BusMessage::SendPushForMessage { user_id, message };
        self.publish(&Self::subject_push(), &bus_msg).await
    }

    pub async fn update_presence(
        &self,
        user_id: Uuid,
        is_online: bool,
        gateway_id: Option<String>,
        device_id: Option<String>,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::PresenceUpdate {
            user_id,
            is_online,
            gateway_id,
            device_id,
        };
        self.publish(&Self::subject_presence(user_id), &bus_msg).await
    }

    pub async fn update_typing(
        &self,
        user_id: Uuid,
        room_id: Uuid,
        is_typing: bool,
    ) -> anyhow::Result<()> {
        let bus_msg = BusMessage::TypingUpdate {
            user_id,
            room_id,
            is_typing,
        };
        self.publish(&Self::subject_typing(room_id), &bus_msg).await
    }

    // Subscribe helpers
    pub async fn subscribe(
        &self,
        subject: &str,
    ) -> anyhow::Result<mpsc::UnboundedReceiver<BusMessage>> {
        let (tx, rx) = mpsc::unbounded_channel();
        let mut subscriber = self.client.subscribe(subject.to_string()).await?;

        tokio::spawn(async move {
            while let Some(msg) = subscriber.next().await {
                if let Ok(bus_msg) = serde_json::from_slice::<BusMessage>(&msg.payload) {
                    if tx.send(bus_msg).is_err() {
                        break;
                    }
                }
            }
        });

        Ok(rx)
    }

    pub async fn subscribe_gateway(
        &self,
        gateway_id: &str,
    ) -> anyhow::Result<mpsc::UnboundedReceiver<BusMessage>> {
        self.subscribe(&Self::subject_gateway(gateway_id)).await
    }

    pub async fn subscribe_push(&self) -> anyhow::Result<mpsc::UnboundedReceiver<BusMessage>> {
        self.subscribe(&Self::subject_push()).await
    }

    pub async fn subscribe_presence_all(&self) -> anyhow::Result<mpsc::UnboundedReceiver<BusMessage>> {
        self.subscribe("presence.>").await
    }
}

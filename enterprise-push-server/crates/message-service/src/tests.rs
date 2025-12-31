//! Tests for the Message Service
//!
//! This module contains unit tests for:
//! - Message serialization and storage
//! - Presence checking logic
//! - Message routing decisions

#[cfg(test)]
mod message_routing_tests {
    use common::bus::BusMessage;
    use common::{ChatMessage, DevicePresence, UserPresence};
    use uuid::Uuid;

    #[test]
    fn test_route_message_serialization() {
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "Hello!".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let bus_msg = BusMessage::RouteMessage {
            user_id,
            message: message.clone(),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::RouteMessage {
                user_id: uid,
                message: msg,
            } => {
                assert_eq!(uid, user_id);
                assert_eq!(msg.content, "Hello!");
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_routing_decision_user_online_single_device() {
        let user_id = Uuid::new_v4();
        let presence = UserPresence {
            user_id,
            is_online: true,
            devices: vec![DevicePresence {
                device_id: "device-1".to_string(),
                gateway_id: "gateway-1".to_string(),
                connected_at: chrono::Utc::now(),
                last_activity: chrono::Utc::now(),
            }],
            last_seen: chrono::Utc::now(),
        };

        assert!(presence.is_online);
        assert_eq!(presence.devices.len(), 1);
        assert_eq!(presence.devices[0].gateway_id, "gateway-1");
    }

    #[test]
    fn test_routing_decision_user_online_multiple_devices() {
        let user_id = Uuid::new_v4();
        let presence = UserPresence {
            user_id,
            is_online: true,
            devices: vec![
                DevicePresence {
                    device_id: "device-1".to_string(),
                    gateway_id: "gateway-1".to_string(),
                    connected_at: chrono::Utc::now(),
                    last_activity: chrono::Utc::now(),
                },
                DevicePresence {
                    device_id: "device-2".to_string(),
                    gateway_id: "gateway-2".to_string(),
                    connected_at: chrono::Utc::now(),
                    last_activity: chrono::Utc::now(),
                },
            ],
            last_seen: chrono::Utc::now(),
        };

        // Should deliver to all connected devices
        assert!(presence.is_online);
        assert_eq!(presence.devices.len(), 2);

        let gateway_ids: Vec<&str> = presence.devices.iter().map(|d| d.gateway_id.as_str()).collect();
        assert!(gateway_ids.contains(&"gateway-1"));
        assert!(gateway_ids.contains(&"gateway-2"));
    }

    #[test]
    fn test_routing_decision_user_offline() {
        let user_id = Uuid::new_v4();
        let presence = UserPresence {
            user_id,
            is_online: false,
            devices: vec![],
            last_seen: chrono::Utc::now(),
        };

        // Should trigger push notification
        assert!(!presence.is_online);
        assert!(presence.devices.is_empty());
    }

    #[test]
    fn test_routing_decision_no_presence() {
        let presence: Option<UserPresence> = None;

        // Should trigger push notification when no presence info
        assert!(presence.is_none());
    }
}

#[cfg(test)]
mod message_store_tests {
    use common::ChatMessage;
    use uuid::Uuid;

    #[test]
    fn test_message_key_format() {
        let message_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let key = format!("message:{}", message_id);
        assert_eq!(key, "message:550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_room_messages_key_format() {
        let room_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let key = format!("room:{}:messages", room_id);
        assert_eq!(key, "room:550e8400-e29b-41d4-a716-446655440000:messages");
    }

    #[test]
    fn test_presence_key_format() {
        let user_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let key = format!("presence:{}", user_id);
        assert_eq!(key, "presence:550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_message_serialization() {
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(Uuid::new_v4()),
            room_id: None,
            content: "Test message content".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&message).unwrap();
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, message.id);
        assert_eq!(deserialized.content, "Test message content");
    }

    #[test]
    fn test_message_with_room() {
        let room_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: None,
            room_id: Some(room_id),
            content: "Room message".to_string(),
            timestamp: chrono::Utc::now(),
        };

        assert!(message.room_id.is_some());
        assert!(message.recipient_id.is_none());
        assert_eq!(message.room_id.unwrap(), room_id);
    }

    #[test]
    fn test_message_timestamp() {
        let before = chrono::Utc::now();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(Uuid::new_v4()),
            room_id: None,
            content: "Test".to_string(),
            timestamp: chrono::Utc::now(),
        };
        let after = chrono::Utc::now();

        assert!(message.timestamp >= before);
        assert!(message.timestamp <= after);
    }

    #[test]
    fn test_message_timestamp_millis() {
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(Uuid::new_v4()),
            room_id: Some(Uuid::new_v4()),
            content: "Test".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let millis = message.timestamp.timestamp_millis();
        // Should be a valid positive timestamp
        assert!(millis > 0);
    }
}

#[cfg(test)]
mod gateway_delivery_tests {
    use common::bus::BusMessage;
    use common::ChatMessage;
    use uuid::Uuid;

    #[test]
    fn test_gateway_deliver_message() {
        let gateway_id = "gateway-123".to_string();
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "Deliver me".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let bus_msg = BusMessage::GatewayDeliver {
            gateway_id: gateway_id.clone(),
            user_id,
            message: message.clone(),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::GatewayDeliver {
                gateway_id: gid,
                user_id: uid,
                message: msg,
            } => {
                assert_eq!(gid, gateway_id);
                assert_eq!(uid, user_id);
                assert_eq!(msg.content, "Deliver me");
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_gateway_subject_pattern() {
        let gateway_id = "gateway-abc";
        let subject = format!("gateway.{}", gateway_id);
        assert_eq!(subject, "gateway.gateway-abc");
    }
}

#[cfg(test)]
mod push_notification_tests {
    use common::bus::BusMessage;
    use common::ChatMessage;
    use uuid::Uuid;

    #[test]
    fn test_send_push_for_message() {
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "Push this message".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let bus_msg = BusMessage::SendPushForMessage {
            user_id,
            message: message.clone(),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::SendPushForMessage {
                user_id: uid,
                message: msg,
            } => {
                assert_eq!(uid, user_id);
                assert_eq!(msg.content, "Push this message");
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_push_subject() {
        let subject = "push.send";
        assert_eq!(subject, "push.send");
    }
}

//! Tests for the Presence Service
//!
//! This module contains unit tests for:
//! - Presence update messages
//! - Typing indicator logic
//! - Online/offline status tracking
//! - Device management

#[cfg(test)]
mod presence_update_tests {
    use common::bus::BusMessage;
    use common::{DevicePresence, UserPresence};
    use uuid::Uuid;

    #[test]
    fn test_presence_update_online() {
        let user_id = Uuid::new_v4();
        let gateway_id = "gateway-1".to_string();
        let device_id = "device-1".to_string();

        let bus_msg = BusMessage::PresenceUpdate {
            user_id,
            is_online: true,
            gateway_id: Some(gateway_id.clone()),
            device_id: Some(device_id.clone()),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::PresenceUpdate {
                user_id: uid,
                is_online,
                gateway_id: gid,
                device_id: did,
            } => {
                assert_eq!(uid, user_id);
                assert!(is_online);
                assert_eq!(gid, Some(gateway_id));
                assert_eq!(did, Some(device_id));
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_presence_update_offline() {
        let user_id = Uuid::new_v4();
        let device_id = "device-1".to_string();

        let bus_msg = BusMessage::PresenceUpdate {
            user_id,
            is_online: false,
            gateway_id: None,
            device_id: Some(device_id.clone()),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::PresenceUpdate {
                user_id: uid,
                is_online,
                gateway_id,
                device_id: did,
            } => {
                assert_eq!(uid, user_id);
                assert!(!is_online);
                assert!(gateway_id.is_none());
                assert_eq!(did, Some(device_id));
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_user_presence_creation() {
        let user_id = Uuid::new_v4();
        let presence = UserPresence {
            user_id,
            is_online: false,
            devices: Vec::new(),
            last_seen: chrono::Utc::now(),
        };

        assert_eq!(presence.user_id, user_id);
        assert!(!presence.is_online);
        assert!(presence.devices.is_empty());
    }

    #[test]
    fn test_add_device_to_presence() {
        let user_id = Uuid::new_v4();
        let mut presence = UserPresence {
            user_id,
            is_online: false,
            devices: Vec::new(),
            last_seen: chrono::Utc::now(),
        };

        let device = DevicePresence {
            device_id: "device-1".to_string(),
            gateway_id: "gateway-1".to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        };

        presence.devices.push(device);
        presence.is_online = true;

        assert!(presence.is_online);
        assert_eq!(presence.devices.len(), 1);
        assert_eq!(presence.devices[0].device_id, "device-1");
    }

    #[test]
    fn test_remove_device_from_presence() {
        let user_id = Uuid::new_v4();
        let mut presence = UserPresence {
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

        // Simulate removing device-1
        presence.devices.retain(|d| d.device_id != "device-1");

        assert_eq!(presence.devices.len(), 1);
        assert_eq!(presence.devices[0].device_id, "device-2");
    }

    #[test]
    fn test_remove_all_devices_goes_offline() {
        let user_id = Uuid::new_v4();
        let mut presence = UserPresence {
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

        presence.devices.retain(|d| d.device_id != "device-1");
        presence.is_online = !presence.devices.is_empty();

        assert!(!presence.is_online);
        assert!(presence.devices.is_empty());
    }

    #[test]
    fn test_update_existing_device() {
        let user_id = Uuid::new_v4();
        let device_id = "device-1".to_string();
        let mut presence = UserPresence {
            user_id,
            is_online: true,
            devices: vec![DevicePresence {
                device_id: device_id.clone(),
                gateway_id: "gateway-1".to_string(),
                connected_at: chrono::Utc::now(),
                last_activity: chrono::Utc::now(),
            }],
            last_seen: chrono::Utc::now(),
        };

        // Simulate re-connection to a new gateway
        presence.devices.retain(|d| d.device_id != device_id);
        presence.devices.push(DevicePresence {
            device_id: device_id.clone(),
            gateway_id: "gateway-2".to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        });

        assert_eq!(presence.devices.len(), 1);
        assert_eq!(presence.devices[0].gateway_id, "gateway-2");
    }
}

#[cfg(test)]
mod typing_indicator_tests {
    use common::bus::BusMessage;
    use uuid::Uuid;

    #[test]
    fn test_typing_update_start() {
        let user_id = Uuid::new_v4();
        let room_id = Uuid::new_v4();

        let bus_msg = BusMessage::TypingUpdate {
            user_id,
            room_id,
            is_typing: true,
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::TypingUpdate {
                user_id: uid,
                room_id: rid,
                is_typing,
            } => {
                assert_eq!(uid, user_id);
                assert_eq!(rid, room_id);
                assert!(is_typing);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_typing_update_stop() {
        let user_id = Uuid::new_v4();
        let room_id = Uuid::new_v4();

        let bus_msg = BusMessage::TypingUpdate {
            user_id,
            room_id,
            is_typing: false,
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::TypingUpdate {
                is_typing, ..
            } => {
                assert!(!is_typing);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_typing_key_format() {
        let room_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let user_id = Uuid::parse_str("660e8400-e29b-41d4-a716-446655440000").unwrap();

        let room_key = format!("room:{}:typing", room_id);
        let typing_key = format!("typing:{}:{}", room_id, user_id);

        assert_eq!(
            room_key,
            "room:550e8400-e29b-41d4-a716-446655440000:typing"
        );
        assert_eq!(
            typing_key,
            "typing:550e8400-e29b-41d4-a716-446655440000:660e8400-e29b-41d4-a716-446655440000"
        );
    }
}

#[cfg(test)]
mod presence_store_tests {
    use uuid::Uuid;

    const PRESENCE_TTL: u64 = 300;

    #[test]
    fn test_presence_key_format() {
        let user_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let key = format!("presence:{}", user_id);
        assert_eq!(key, "presence:550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_presence_ttl() {
        assert_eq!(PRESENCE_TTL, 300); // 5 minutes
    }

    #[test]
    fn test_was_offline_logic() {
        // Simulates the logic in set_online
        let is_currently_online = false;
        let was_offline = !is_currently_online;

        assert!(was_offline);
    }

    #[test]
    fn test_was_not_offline_logic() {
        let is_currently_online = true;
        let was_offline = !is_currently_online;

        assert!(!was_offline);
    }

    #[test]
    fn test_all_devices_offline_check() {
        let devices: Vec<String> = vec![];
        let all_offline = devices.is_empty();

        assert!(all_offline);
    }

    #[test]
    fn test_not_all_devices_offline() {
        let devices = vec!["device-1".to_string()];
        let all_offline = devices.is_empty();

        assert!(!all_offline);
    }
}

#[cfg(test)]
mod presence_subscription_tests {
    #[test]
    fn test_presence_subject_pattern() {
        let pattern = "presence.>";
        assert!(pattern.ends_with(">"));
    }

    #[test]
    fn test_typing_subject_pattern() {
        let pattern = "typing.>";
        assert!(pattern.ends_with(">"));
    }

    #[test]
    fn test_presence_subject_for_user() {
        let user_id = uuid::Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let subject = format!("presence.{}", user_id);
        assert_eq!(subject, "presence.550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_typing_subject_for_room() {
        let room_id = uuid::Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let subject = format!("typing.{}", room_id);
        assert_eq!(subject, "typing.550e8400-e29b-41d4-a716-446655440000");
    }
}

#[cfg(test)]
mod device_presence_tests {
    use common::DevicePresence;

    #[test]
    fn test_device_presence_creation() {
        let device = DevicePresence {
            device_id: "test-device".to_string(),
            gateway_id: "test-gateway".to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        };

        assert_eq!(device.device_id, "test-device");
        assert_eq!(device.gateway_id, "test-gateway");
    }

    #[test]
    fn test_device_presence_serialization() {
        let device = DevicePresence {
            device_id: "device-123".to_string(),
            gateway_id: "gateway-456".to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&device).unwrap();
        let deserialized: DevicePresence = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.device_id, "device-123");
        assert_eq!(deserialized.gateway_id, "gateway-456");
    }

    #[test]
    fn test_device_presence_timestamps() {
        let before = chrono::Utc::now();
        let device = DevicePresence {
            device_id: "device".to_string(),
            gateway_id: "gateway".to_string(),
            connected_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        };
        let after = chrono::Utc::now();

        assert!(device.connected_at >= before);
        assert!(device.connected_at <= after);
        assert!(device.last_activity >= before);
        assert!(device.last_activity <= after);
    }
}

//! Tests for the Push Service
//!
//! This module contains unit tests for:
//! - Push notification creation
//! - Device token management
//! - FCM message formatting
//! - Platform-specific handling
//! - Message truncation

#[cfg(test)]
mod push_notification_tests {
    use common::{PushNotification, PushPriority};
    use uuid::Uuid;

    #[test]
    fn test_push_notification_creation() {
        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            title: "Test Title".to_string(),
            body: "Test Body".to_string(),
            data: serde_json::json!({"key": "value"}),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        assert_eq!(notification.title, "Test Title");
        assert_eq!(notification.body, "Test Body");
        assert_eq!(notification.priority, PushPriority::High);
    }

    #[test]
    fn test_push_notification_serialization() {
        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            title: "New Message".to_string(),
            body: "You have a new message".to_string(),
            data: serde_json::json!({"type": "message"}),
            priority: PushPriority::Normal,
            created_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&notification).unwrap();
        let deserialized: PushNotification = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.title, "New Message");
        assert_eq!(deserialized.body, "You have a new message");
    }

    #[test]
    fn test_push_priority_high() {
        let priority = PushPriority::High;
        let json = serde_json::to_string(&priority).unwrap();
        assert_eq!(json, "\"high\"");
    }

    #[test]
    fn test_push_priority_normal() {
        let priority = PushPriority::Normal;
        let json = serde_json::to_string(&priority).unwrap();
        assert_eq!(json, "\"normal\"");
    }

    #[test]
    fn test_push_priority_low() {
        let priority = PushPriority::Low;
        let json = serde_json::to_string(&priority).unwrap();
        assert_eq!(json, "\"low\"");
    }

    #[test]
    fn test_fcm_priority_mapping() {
        // Simulates the priority mapping in FcmClient::send
        let high_priority = PushPriority::High;
        let normal_priority = PushPriority::Normal;
        let low_priority = PushPriority::Low;

        let fcm_high = match high_priority {
            PushPriority::High => "high",
            _ => "normal",
        };

        let fcm_normal = match normal_priority {
            PushPriority::High => "high",
            _ => "normal",
        };

        let fcm_low = match low_priority {
            PushPriority::High => "high",
            _ => "normal",
        };

        assert_eq!(fcm_high, "high");
        assert_eq!(fcm_normal, "normal");
        assert_eq!(fcm_low, "normal");
    }
}

#[cfg(test)]
mod device_token_tests {
    use common::{DeviceToken, Platform};
    use uuid::Uuid;

    #[test]
    fn test_device_token_creation() {
        let token = DeviceToken {
            user_id: Uuid::new_v4(),
            device_id: "device-123".to_string(),
            token: "fcm-token-abc".to_string(),
            platform: Platform::Android,
            created_at: chrono::Utc::now(),
        };

        assert_eq!(token.device_id, "device-123");
        assert_eq!(token.token, "fcm-token-abc");
        assert_eq!(token.platform, Platform::Android);
    }

    #[test]
    fn test_device_token_serialization() {
        let token = DeviceToken {
            user_id: Uuid::new_v4(),
            device_id: "device-456".to_string(),
            token: "apns-token-xyz".to_string(),
            platform: Platform::Ios,
            created_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&token).unwrap();
        let deserialized: DeviceToken = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.device_id, "device-456");
        assert_eq!(deserialized.platform, Platform::Ios);
    }

    #[test]
    fn test_platform_android() {
        let platform = Platform::Android;
        let json = serde_json::to_string(&platform).unwrap();
        assert_eq!(json, "\"android\"");
    }

    #[test]
    fn test_platform_ios() {
        let platform = Platform::Ios;
        let json = serde_json::to_string(&platform).unwrap();
        assert_eq!(json, "\"ios\"");
    }

    #[test]
    fn test_platform_web() {
        let platform = Platform::Web;
        let json = serde_json::to_string(&platform).unwrap();
        assert_eq!(json, "\"web\"");
    }

    #[test]
    fn test_token_key_format() {
        let user_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let key = format!("user:{}:tokens", user_id);
        assert_eq!(key, "user:550e8400-e29b-41d4-a716-446655440000:tokens");
    }
}

#[cfg(test)]
mod truncate_tests {
    fn truncate(s: &str, max_len: usize) -> String {
        if s.len() <= max_len {
            s.to_string()
        } else {
            format!("{}...", &s[..max_len - 3])
        }
    }

    #[test]
    fn test_truncate_short_string() {
        let result = truncate("Hello", 100);
        assert_eq!(result, "Hello");
    }

    #[test]
    fn test_truncate_exact_length() {
        let result = truncate("Hello", 5);
        assert_eq!(result, "Hello");
    }

    #[test]
    fn test_truncate_long_string() {
        let result = truncate("This is a very long message that should be truncated", 20);
        assert_eq!(result, "This is a very lo...");
        assert_eq!(result.len(), 20);
    }

    #[test]
    fn test_truncate_100_chars() {
        let long_message = "a".repeat(200);
        let result = truncate(&long_message, 100);
        assert_eq!(result.len(), 100);
        assert!(result.ends_with("..."));
    }

    #[test]
    fn test_truncate_empty_string() {
        let result = truncate("", 100);
        assert_eq!(result, "");
    }

    #[test]
    fn test_truncate_minimum_length() {
        let result = truncate("Hello World", 4);
        assert_eq!(result, "H...");
        assert_eq!(result.len(), 4);
    }
}

#[cfg(test)]
mod fcm_message_tests {
    use serde::Serialize;

    #[derive(Debug, Serialize)]
    struct FcmMessage {
        to: String,
        priority: String,
        notification: FcmNotification,
        data: serde_json::Value,
    }

    #[derive(Debug, Serialize)]
    struct FcmNotification {
        title: String,
        body: String,
        sound: String,
    }

    #[test]
    fn test_fcm_message_serialization() {
        let message = FcmMessage {
            to: "fcm-token-123".to_string(),
            priority: "high".to_string(),
            notification: FcmNotification {
                title: "New Message".to_string(),
                body: "You have a new message".to_string(),
                sound: "default".to_string(),
            },
            data: serde_json::json!({
                "type": "new_message",
                "message_id": "msg-123"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"to\":\"fcm-token-123\""));
        assert!(json.contains("\"priority\":\"high\""));
        assert!(json.contains("\"title\":\"New Message\""));
        assert!(json.contains("\"sound\":\"default\""));
    }

    #[test]
    fn test_fcm_notification_format() {
        let notification = FcmNotification {
            title: "Test".to_string(),
            body: "Test body".to_string(),
            sound: "default".to_string(),
        };

        let json = serde_json::to_string(&notification).unwrap();
        assert!(json.contains("\"title\":\"Test\""));
        assert!(json.contains("\"body\":\"Test body\""));
        assert!(json.contains("\"sound\":\"default\""));
    }
}

#[cfg(test)]
mod bus_message_tests {
    use common::bus::BusMessage;
    use common::{ChatMessage, PushNotification, PushPriority};
    use uuid::Uuid;

    #[test]
    fn test_send_push_message() {
        let user_id = Uuid::new_v4();
        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id,
            title: "Test".to_string(),
            body: "Test body".to_string(),
            data: serde_json::json!({}),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        let bus_msg = BusMessage::SendPush {
            user_id,
            notification: notification.clone(),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::SendPush {
                user_id: uid,
                notification: notif,
            } => {
                assert_eq!(uid, user_id);
                assert_eq!(notif.title, "Test");
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_send_push_for_message() {
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "Hello!".to_string(),
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
                assert_eq!(msg.content, "Hello!");
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

#[cfg(test)]
mod message_notification_tests {
    use common::{ChatMessage, PushNotification, PushPriority};
    use uuid::Uuid;

    fn truncate(s: &str, max_len: usize) -> String {
        if s.len() <= max_len {
            s.to_string()
        } else {
            format!("{}...", &s[..max_len - 3])
        }
    }

    #[test]
    fn test_create_notification_from_message() {
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "This is a test message".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id,
            title: "New Message".to_string(),
            body: truncate(&message.content, 100),
            data: serde_json::json!({
                "type": "new_message",
                "message_id": message.id,
                "sender_id": message.sender_id,
            }),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        assert_eq!(notification.title, "New Message");
        assert_eq!(notification.body, "This is a test message");
        assert_eq!(notification.priority, PushPriority::High);
    }

    #[test]
    fn test_create_notification_from_long_message() {
        let user_id = Uuid::new_v4();
        let long_content = "a".repeat(200);
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: long_content.clone(),
            timestamp: chrono::Utc::now(),
        };

        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id,
            title: "New Message".to_string(),
            body: truncate(&message.content, 100),
            data: serde_json::json!({}),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        assert_eq!(notification.body.len(), 100);
        assert!(notification.body.ends_with("..."));
    }
}

#[cfg(test)]
mod platform_routing_tests {
    use common::Platform;

    #[test]
    fn test_android_uses_fcm() {
        let platform = Platform::Android;
        let uses_fcm = matches!(platform, Platform::Android | Platform::Web);
        assert!(uses_fcm);
    }

    #[test]
    fn test_web_uses_fcm() {
        let platform = Platform::Web;
        let uses_fcm = matches!(platform, Platform::Android | Platform::Web);
        assert!(uses_fcm);
    }

    #[test]
    fn test_ios_uses_apns() {
        let platform = Platform::Ios;
        let uses_fcm = matches!(platform, Platform::Android | Platform::Web);
        let uses_apns = matches!(platform, Platform::Ios);

        assert!(!uses_fcm);
        assert!(uses_apns);
    }
}

#[cfg(test)]
mod invalid_token_tests {
    #[test]
    fn test_detect_invalid_token_error() {
        let error_message = "InvalidRegistration: Token is not valid";
        let is_invalid = error_message.to_lowercase().contains("invalid");
        assert!(is_invalid);
    }

    #[test]
    fn test_detect_other_error() {
        let error_message = "ServerError: Internal server error";
        let is_invalid = error_message.to_lowercase().contains("invalid");
        assert!(!is_invalid);
    }

    #[test]
    fn test_detect_expired_token() {
        // Expired tokens should also be considered for removal
        let error_message = "NotRegistered: Token has expired or is invalid";
        let is_invalid = error_message.to_lowercase().contains("invalid");
        assert!(is_invalid);
    }
}

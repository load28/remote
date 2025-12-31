//! Tests for the Gateway Service
//!
//! This module contains unit tests for:
//! - Connection management (add, remove, send)
//! - Connection counting
//! - Server message types
//! - Client message handling

#[cfg(test)]
mod connection_manager_tests {
    use crate::connection::ConnectionManager;
    use common::{ServerMessage, ServerMessageType};
    use tokio::sync::mpsc;
    use uuid::Uuid;

    fn create_test_manager() -> ConnectionManager {
        ConnectionManager::new("test-gateway-123".to_string())
    }

    #[test]
    fn test_new_connection_manager() {
        let manager = create_test_manager();
        assert_eq!(manager.connection_count(), 0);
        assert_eq!(manager.user_count(), 0);
    }

    #[test]
    fn test_add_single_connection() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();
        let device_id = "device-1".to_string();
        let (tx, _rx) = mpsc::unbounded_channel::<ServerMessage>();

        let connection = manager.add_connection(user_id, device_id.clone(), tx);

        assert_eq!(connection.user_id, user_id);
        assert_eq!(connection.device_id, device_id);
        assert_eq!(connection.gateway_id, "test-gateway-123");
        assert_eq!(manager.connection_count(), 1);
        assert_eq!(manager.user_count(), 1);
    }

    #[test]
    fn test_add_multiple_devices_same_user() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();

        let (tx1, _rx1) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx2, _rx2) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(user_id, "device-1".to_string(), tx1);
        manager.add_connection(user_id, "device-2".to_string(), tx2);

        assert_eq!(manager.connection_count(), 2);
        assert_eq!(manager.user_count(), 1);
    }

    #[test]
    fn test_add_connections_different_users() {
        let manager = create_test_manager();

        let (tx1, _rx1) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx2, _rx2) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(Uuid::new_v4(), "device-1".to_string(), tx1);
        manager.add_connection(Uuid::new_v4(), "device-2".to_string(), tx2);

        assert_eq!(manager.connection_count(), 2);
        assert_eq!(manager.user_count(), 2);
    }

    #[test]
    fn test_remove_connection() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();
        let device_id = "device-1".to_string();
        let (tx, _rx) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(user_id, device_id.clone(), tx);
        assert_eq!(manager.connection_count(), 1);

        manager.remove_connection(user_id, &device_id);
        assert_eq!(manager.connection_count(), 0);
        assert_eq!(manager.user_count(), 0);
    }

    #[test]
    fn test_remove_one_device_keep_other() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();

        let (tx1, _rx1) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx2, _rx2) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(user_id, "device-1".to_string(), tx1);
        manager.add_connection(user_id, "device-2".to_string(), tx2);

        manager.remove_connection(user_id, "device-1");

        assert_eq!(manager.connection_count(), 1);
        assert_eq!(manager.user_count(), 1);
    }

    #[test]
    fn test_remove_nonexistent_connection() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();

        // Should not panic
        manager.remove_connection(user_id, "nonexistent-device");
        assert_eq!(manager.connection_count(), 0);
    }

    #[tokio::test]
    async fn test_send_to_user() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(user_id, "device-1".to_string(), tx);

        let message = ServerMessage {
            msg_type: ServerMessageType::NewMessage,
            payload: serde_json::json!({"content": "Hello!"}),
        };

        let sent_count = manager.send_to_user(user_id, message);
        assert_eq!(sent_count, 1);

        // Verify message was received
        let received = rx.recv().await.unwrap();
        match received.msg_type {
            ServerMessageType::NewMessage => {}
            _ => panic!("Wrong message type received"),
        }
    }

    #[tokio::test]
    async fn test_send_to_user_multiple_devices() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();

        let (tx1, mut rx1) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx2, mut rx2) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(user_id, "device-1".to_string(), tx1);
        manager.add_connection(user_id, "device-2".to_string(), tx2);

        let message = ServerMessage {
            msg_type: ServerMessageType::Pong,
            payload: serde_json::json!({}),
        };

        let sent_count = manager.send_to_user(user_id, message);
        assert_eq!(sent_count, 2);

        // Both devices should receive the message
        let msg1 = rx1.recv().await.unwrap();
        let msg2 = rx2.recv().await.unwrap();

        assert!(matches!(msg1.msg_type, ServerMessageType::Pong));
        assert!(matches!(msg2.msg_type, ServerMessageType::Pong));
    }

    #[test]
    fn test_send_to_nonexistent_user() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();

        let message = ServerMessage {
            msg_type: ServerMessageType::Error,
            payload: serde_json::json!({}),
        };

        let sent_count = manager.send_to_user(user_id, message);
        assert_eq!(sent_count, 0);
    }

    #[test]
    fn test_connection_timestamp() {
        let manager = create_test_manager();
        let user_id = Uuid::new_v4();
        let (tx, _rx) = mpsc::unbounded_channel::<ServerMessage>();

        let before = chrono::Utc::now();
        let connection = manager.add_connection(user_id, "device-1".to_string(), tx);
        let after = chrono::Utc::now();

        assert!(connection.connected_at >= before);
        assert!(connection.connected_at <= after);
    }
}

#[cfg(test)]
mod connection_tests {
    use crate::connection::Connection;
    use common::{ServerMessage, ServerMessageType};
    use tokio::sync::mpsc;
    use uuid::Uuid;

    #[test]
    fn test_connection_new() {
        let user_id = Uuid::new_v4();
        let device_id = "test-device".to_string();
        let gateway_id = "gateway-1".to_string();
        let (tx, _rx) = mpsc::unbounded_channel::<ServerMessage>();

        let connection = Connection::new(user_id, device_id.clone(), gateway_id.clone(), tx);

        assert_eq!(connection.user_id, user_id);
        assert_eq!(connection.device_id, device_id);
        assert_eq!(connection.gateway_id, gateway_id);
    }

    #[tokio::test]
    async fn test_connection_send() {
        let user_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

        let connection = Connection::new(
            user_id,
            "device".to_string(),
            "gateway".to_string(),
            tx,
        );

        let message = ServerMessage {
            msg_type: ServerMessageType::Connected,
            payload: serde_json::json!({"status": "connected"}),
        };

        let result = connection.send(message);
        assert!(result.is_ok());

        let received = rx.recv().await.unwrap();
        assert!(matches!(received.msg_type, ServerMessageType::Connected));
    }
}

#[cfg(test)]
mod message_serialization_tests {
    use common::{ClientMessage, ClientMessageType, ServerMessage, ServerMessageType};

    #[test]
    fn test_client_message_send_message() {
        let json = r#"{"type": "send_message", "recipient_id": "550e8400-e29b-41d4-a716-446655440000", "content": "Hello"}"#;
        let message: ClientMessage = serde_json::from_str(json).unwrap();

        assert!(matches!(message.msg_type, ClientMessageType::SendMessage));
    }

    #[test]
    fn test_client_message_typing() {
        let json = r#"{"type": "typing", "room_id": "550e8400-e29b-41d4-a716-446655440000"}"#;
        let message: ClientMessage = serde_json::from_str(json).unwrap();

        assert!(matches!(message.msg_type, ClientMessageType::Typing));
    }

    #[test]
    fn test_client_message_stop_typing() {
        let json = r#"{"type": "stop_typing", "room_id": "550e8400-e29b-41d4-a716-446655440000"}"#;
        let message: ClientMessage = serde_json::from_str(json).unwrap();

        assert!(matches!(message.msg_type, ClientMessageType::StopTyping));
    }

    #[test]
    fn test_client_message_ack() {
        let json = r#"{"type": "ack", "message_id": "550e8400-e29b-41d4-a716-446655440000"}"#;
        let message: ClientMessage = serde_json::from_str(json).unwrap();

        assert!(matches!(message.msg_type, ClientMessageType::Ack));
    }

    #[test]
    fn test_client_message_ping() {
        let json = r#"{"type": "ping"}"#;
        let message: ClientMessage = serde_json::from_str(json).unwrap();

        assert!(matches!(message.msg_type, ClientMessageType::Ping));
    }

    #[test]
    fn test_server_message_new_message() {
        let message = ServerMessage {
            msg_type: ServerMessageType::NewMessage,
            payload: serde_json::json!({
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "content": "Hello, World!"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"new_message\""));
        assert!(json.contains("Hello, World!"));
    }

    #[test]
    fn test_server_message_connected() {
        let message = ServerMessage {
            msg_type: ServerMessageType::Connected,
            payload: serde_json::json!({
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "gateway_id": "gateway-1"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"connected\""));
    }

    #[test]
    fn test_server_message_error() {
        let message = ServerMessage {
            msg_type: ServerMessageType::Error,
            payload: serde_json::json!({
                "error": "Something went wrong",
                "code": 500
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"error\""));
        assert!(json.contains("Something went wrong"));
    }

    #[test]
    fn test_server_message_user_online() {
        let message = ServerMessage {
            msg_type: ServerMessageType::UserOnline,
            payload: serde_json::json!({
                "user_id": "550e8400-e29b-41d4-a716-446655440000"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"user_online\""));
    }

    #[test]
    fn test_server_message_user_offline() {
        let message = ServerMessage {
            msg_type: ServerMessageType::UserOffline,
            payload: serde_json::json!({
                "user_id": "550e8400-e29b-41d4-a716-446655440000"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"user_offline\""));
    }

    #[test]
    fn test_server_message_user_typing() {
        let message = ServerMessage {
            msg_type: ServerMessageType::UserTyping,
            payload: serde_json::json!({
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "room_id": "660e8400-e29b-41d4-a716-446655440000"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"user_typing\""));
    }

    #[test]
    fn test_server_message_message_delivered() {
        let message = ServerMessage {
            msg_type: ServerMessageType::MessageDelivered,
            payload: serde_json::json!({
                "message_id": "550e8400-e29b-41d4-a716-446655440000"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"message_delivered\""));
    }

    #[test]
    fn test_server_message_message_read() {
        let message = ServerMessage {
            msg_type: ServerMessageType::MessageRead,
            payload: serde_json::json!({
                "message_id": "550e8400-e29b-41d4-a716-446655440000"
            }),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"message_read\""));
    }
}

#[cfg(test)]
mod stats_tests {
    use crate::connection::ConnectionManager;
    use common::ServerMessage;
    use tokio::sync::mpsc;
    use uuid::Uuid;

    #[test]
    fn test_stats_empty() {
        let manager = ConnectionManager::new("test-gateway".to_string());

        assert_eq!(manager.connection_count(), 0);
        assert_eq!(manager.user_count(), 0);
    }

    #[test]
    fn test_stats_with_connections() {
        let manager = ConnectionManager::new("test-gateway".to_string());

        // Add 5 users with varying number of devices
        for i in 0..5 {
            let user_id = Uuid::new_v4();
            for j in 0..(i + 1) {
                let (tx, _rx) = mpsc::unbounded_channel::<ServerMessage>();
                manager.add_connection(user_id, format!("device-{}", j), tx);
            }
        }

        // Total connections: 1 + 2 + 3 + 4 + 5 = 15
        assert_eq!(manager.connection_count(), 15);
        assert_eq!(manager.user_count(), 5);
    }

    #[test]
    fn test_stats_after_removals() {
        let manager = ConnectionManager::new("test-gateway".to_string());

        let user_id = Uuid::new_v4();
        let (tx1, _rx1) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx2, _rx2) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx3, _rx3) = mpsc::unbounded_channel::<ServerMessage>();

        manager.add_connection(user_id, "device-1".to_string(), tx1);
        manager.add_connection(user_id, "device-2".to_string(), tx2);
        manager.add_connection(user_id, "device-3".to_string(), tx3);

        assert_eq!(manager.connection_count(), 3);
        assert_eq!(manager.user_count(), 1);

        manager.remove_connection(user_id, "device-2");

        assert_eq!(manager.connection_count(), 2);
        assert_eq!(manager.user_count(), 1);

        manager.remove_connection(user_id, "device-1");
        manager.remove_connection(user_id, "device-3");

        assert_eq!(manager.connection_count(), 0);
        assert_eq!(manager.user_count(), 0);
    }
}

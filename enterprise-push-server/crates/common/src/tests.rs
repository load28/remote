//! Tests for the common library
//!
//! This module contains unit tests for:
//! - JWT service (token generation, validation, expiration)
//! - Type serialization/deserialization
//! - Configuration loading
//! - Error handling
//! - Message bus subject generation

#[cfg(test)]
mod jwt_tests {
    use crate::auth::{extract_bearer_token, JwtService};
    use crate::config::AuthConfig;
    use crate::types::TokenType;
    use uuid::Uuid;

    fn test_auth_config() -> AuthConfig {
        AuthConfig {
            jwt_secret: "test-secret-key-for-jwt-testing-12345".to_string(),
            jwt_expiry_hours: 1,
            refresh_expiry_days: 7,
            oauth_google_client_id: None,
            oauth_google_client_secret: None,
            oauth_github_client_id: None,
            oauth_github_client_secret: None,
        }
    }

    #[test]
    fn test_jwt_service_creation() {
        let config = test_auth_config();
        let _service = JwtService::new(&config);
        // Service should be created without panicking
    }

    #[test]
    fn test_generate_token_pair() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let result = service.generate_token_pair(user_id, email);
        assert!(result.is_ok());

        let token_pair = result.unwrap();
        assert!(!token_pair.access_token.is_empty());
        assert!(!token_pair.refresh_token.is_empty());
        assert_eq!(token_pair.token_type, "Bearer");
        assert_eq!(token_pair.expires_in, 3600); // 1 hour in seconds
    }

    #[test]
    fn test_validate_access_token() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token_pair = service.generate_token_pair(user_id, email).unwrap();
        let claims = service.validate_access_token(&token_pair.access_token);

        assert!(claims.is_ok());
        let claims = claims.unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.token_type, TokenType::Access);
    }

    #[test]
    fn test_validate_refresh_token() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token_pair = service.generate_token_pair(user_id, email).unwrap();
        let claims = service.validate_refresh_token(&token_pair.refresh_token);

        assert!(claims.is_ok());
        let claims = claims.unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.token_type, TokenType::Refresh);
    }

    #[test]
    fn test_validate_access_token_with_refresh_token_fails() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token_pair = service.generate_token_pair(user_id, email).unwrap();
        let result = service.validate_access_token(&token_pair.refresh_token);

        assert!(result.is_err());
    }

    #[test]
    fn test_validate_refresh_token_with_access_token_fails() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token_pair = service.generate_token_pair(user_id, email).unwrap();
        let result = service.validate_refresh_token(&token_pair.access_token);

        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_token_validation() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let result = service.validate_access_token("invalid-token");
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_user_id() {
        let config = test_auth_config();
        let service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token_pair = service.generate_token_pair(user_id, email).unwrap();
        let extracted_id = service.extract_user_id(&token_pair.access_token);

        assert!(extracted_id.is_ok());
        assert_eq!(extracted_id.unwrap(), user_id);
    }

    #[test]
    fn test_different_secrets_produce_different_tokens() {
        let config1 = AuthConfig {
            jwt_secret: "secret-key-1".to_string(),
            jwt_expiry_hours: 1,
            refresh_expiry_days: 7,
            oauth_google_client_id: None,
            oauth_google_client_secret: None,
            oauth_github_client_id: None,
            oauth_github_client_secret: None,
        };

        let config2 = AuthConfig {
            jwt_secret: "secret-key-2".to_string(),
            jwt_expiry_hours: 1,
            refresh_expiry_days: 7,
            oauth_google_client_id: None,
            oauth_google_client_secret: None,
            oauth_github_client_id: None,
            oauth_github_client_secret: None,
        };

        let service1 = JwtService::new(&config1);
        let service2 = JwtService::new(&config2);

        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token1 = service1.generate_token_pair(user_id, email).unwrap();
        let token2 = service2.generate_token_pair(user_id, email).unwrap();

        // Tokens should be different
        assert_ne!(token1.access_token, token2.access_token);

        // Token from service1 should not be validated by service2
        let cross_validate = service2.validate_access_token(&token1.access_token);
        assert!(cross_validate.is_err());
    }

    #[test]
    fn test_extract_bearer_token_valid() {
        let token = extract_bearer_token("Bearer my-token-here");
        assert_eq!(token, Some("my-token-here"));
    }

    #[test]
    fn test_extract_bearer_token_invalid_prefix() {
        let token = extract_bearer_token("Basic my-token-here");
        assert_eq!(token, None);
    }

    #[test]
    fn test_extract_bearer_token_no_prefix() {
        let token = extract_bearer_token("my-token-here");
        assert_eq!(token, None);
    }

    #[test]
    fn test_extract_bearer_token_empty() {
        let token = extract_bearer_token("");
        assert_eq!(token, None);
    }

    #[test]
    fn test_extract_bearer_token_only_bearer() {
        let token = extract_bearer_token("Bearer ");
        assert_eq!(token, Some(""));
    }
}

#[cfg(test)]
mod types_tests {
    use crate::types::*;
    use serde_json;
    use uuid::Uuid;

    #[test]
    fn test_chat_message_serialization() {
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(Uuid::new_v4()),
            room_id: None,
            content: "Hello, world!".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&message);
        assert!(json.is_ok());

        let deserialized: Result<ChatMessage, _> = serde_json::from_str(&json.unwrap());
        assert!(deserialized.is_ok());

        let msg = deserialized.unwrap();
        assert_eq!(msg.id, message.id);
        assert_eq!(msg.content, "Hello, world!");
    }

    #[test]
    fn test_chat_message_without_recipient() {
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: None,
            room_id: Some(Uuid::new_v4()),
            content: "Room message".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&message).unwrap();
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();

        assert!(deserialized.recipient_id.is_none());
        assert!(deserialized.room_id.is_some());
    }

    #[test]
    fn test_user_presence_serialization() {
        let presence = UserPresence {
            user_id: Uuid::new_v4(),
            is_online: true,
            devices: vec![DevicePresence {
                device_id: "device-123".to_string(),
                gateway_id: "gateway-456".to_string(),
                connected_at: chrono::Utc::now(),
                last_activity: chrono::Utc::now(),
            }],
            last_seen: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&presence);
        assert!(json.is_ok());

        let deserialized: Result<UserPresence, _> = serde_json::from_str(&json.unwrap());
        assert!(deserialized.is_ok());

        let pres = deserialized.unwrap();
        assert!(pres.is_online);
        assert_eq!(pres.devices.len(), 1);
        assert_eq!(pres.devices[0].device_id, "device-123");
    }

    #[test]
    fn test_push_notification_serialization() {
        let notification = PushNotification {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            title: "New Message".to_string(),
            body: "You have a new message".to_string(),
            data: serde_json::json!({"key": "value"}),
            priority: PushPriority::High,
            created_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&notification);
        assert!(json.is_ok());

        let deserialized: Result<PushNotification, _> = serde_json::from_str(&json.unwrap());
        assert!(deserialized.is_ok());

        let notif = deserialized.unwrap();
        assert_eq!(notif.title, "New Message");
        assert_eq!(notif.priority, PushPriority::High);
    }

    #[test]
    fn test_push_priority_serialization() {
        assert_eq!(
            serde_json::to_string(&PushPriority::High).unwrap(),
            "\"high\""
        );
        assert_eq!(
            serde_json::to_string(&PushPriority::Normal).unwrap(),
            "\"normal\""
        );
        assert_eq!(
            serde_json::to_string(&PushPriority::Low).unwrap(),
            "\"low\""
        );
    }

    #[test]
    fn test_platform_serialization() {
        assert_eq!(
            serde_json::to_string(&Platform::Android).unwrap(),
            "\"android\""
        );
        assert_eq!(serde_json::to_string(&Platform::Ios).unwrap(), "\"ios\"");
        assert_eq!(serde_json::to_string(&Platform::Web).unwrap(), "\"web\"");
    }

    #[test]
    fn test_device_token_serialization() {
        let token = DeviceToken {
            user_id: Uuid::new_v4(),
            device_id: "device-001".to_string(),
            token: "fcm-token-abc123".to_string(),
            platform: Platform::Android,
            created_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&token);
        assert!(json.is_ok());

        let deserialized: Result<DeviceToken, _> = serde_json::from_str(&json.unwrap());
        assert!(deserialized.is_ok());

        let dt = deserialized.unwrap();
        assert_eq!(dt.device_id, "device-001");
        assert_eq!(dt.platform, Platform::Android);
    }

    #[test]
    fn test_client_message_type_serialization() {
        let message = ClientMessage {
            msg_type: ClientMessageType::SendMessage,
            payload: serde_json::json!({"content": "test"}),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"send_message\""));
    }

    #[test]
    fn test_server_message_type_serialization() {
        let message = ServerMessage {
            msg_type: ServerMessageType::NewMessage,
            payload: serde_json::json!({"content": "test"}),
        };

        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("\"type\":\"new_message\""));
    }

    #[test]
    fn test_all_client_message_types() {
        let types = vec![
            ClientMessageType::SendMessage,
            ClientMessageType::Typing,
            ClientMessageType::StopTyping,
            ClientMessageType::Ack,
            ClientMessageType::Ping,
        ];

        for msg_type in types {
            let message = ClientMessage {
                msg_type: msg_type.clone(),
                payload: serde_json::json!({}),
            };
            let json = serde_json::to_string(&message);
            assert!(json.is_ok(), "Failed to serialize {:?}", msg_type);
        }
    }

    #[test]
    fn test_all_server_message_types() {
        let types = vec![
            ServerMessageType::NewMessage,
            ServerMessageType::MessageDelivered,
            ServerMessageType::MessageRead,
            ServerMessageType::UserOnline,
            ServerMessageType::UserOffline,
            ServerMessageType::UserTyping,
            ServerMessageType::Error,
            ServerMessageType::Pong,
            ServerMessageType::Connected,
        ];

        for msg_type in types {
            let message = ServerMessage {
                msg_type: msg_type.clone(),
                payload: serde_json::json!({}),
            };
            let json = serde_json::to_string(&message);
            assert!(json.is_ok(), "Failed to serialize {:?}", msg_type);
        }
    }

    #[test]
    fn test_token_pair_serialization() {
        let token_pair = TokenPair {
            access_token: "access-token-123".to_string(),
            refresh_token: "refresh-token-456".to_string(),
            expires_in: 3600,
            token_type: "Bearer".to_string(),
        };

        let json = serde_json::to_string(&token_pair).unwrap();
        let deserialized: TokenPair = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.access_token, "access-token-123");
        assert_eq!(deserialized.refresh_token, "refresh-token-456");
        assert_eq!(deserialized.expires_in, 3600);
        assert_eq!(deserialized.token_type, "Bearer");
    }

    #[test]
    fn test_claims_serialization() {
        let claims = Claims {
            sub: Uuid::new_v4().to_string(),
            email: "test@example.com".to_string(),
            exp: 1234567890,
            iat: 1234567800,
            token_type: TokenType::Access,
        };

        let json = serde_json::to_string(&claims).unwrap();
        let deserialized: Claims = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.email, "test@example.com");
        assert_eq!(deserialized.token_type, TokenType::Access);
    }

    #[test]
    fn test_user_serialization() {
        let user = User {
            id: Uuid::new_v4(),
            email: "user@example.com".to_string(),
            username: "testuser".to_string(),
            password_hash: Some("hashed-password".to_string()),
            oauth_provider: None,
            oauth_id: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&user).unwrap();
        let deserialized: User = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.email, "user@example.com");
        assert_eq!(deserialized.username, "testuser");
        assert!(deserialized.password_hash.is_some());
    }

    #[test]
    fn test_user_with_oauth() {
        let user = User {
            id: Uuid::new_v4(),
            email: "oauth@example.com".to_string(),
            username: "oauthuser".to_string(),
            password_hash: None,
            oauth_provider: Some("google".to_string()),
            oauth_id: Some("google-id-123".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&user).unwrap();
        let deserialized: User = serde_json::from_str(&json).unwrap();

        assert!(deserialized.password_hash.is_none());
        assert_eq!(deserialized.oauth_provider, Some("google".to_string()));
    }
}

#[cfg(test)]
mod bus_tests {
    use crate::bus::{BusMessage, MessageBus};
    use crate::types::{ChatMessage, PushNotification, PushPriority};
    use uuid::Uuid;

    #[test]
    fn test_subject_message_route() {
        let user_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let subject = MessageBus::subject_message_route(user_id);
        assert_eq!(subject, "msg.route.550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_subject_gateway() {
        let subject = MessageBus::subject_gateway("gateway-123");
        assert_eq!(subject, "gateway.gateway-123");
    }

    #[test]
    fn test_subject_push() {
        let subject = MessageBus::subject_push();
        assert_eq!(subject, "push.send");
    }

    #[test]
    fn test_subject_presence() {
        let user_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let subject = MessageBus::subject_presence(user_id);
        assert_eq!(subject, "presence.550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_subject_typing() {
        let room_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let subject = MessageBus::subject_typing(room_id);
        assert_eq!(subject, "typing.550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_bus_message_route_message_serialization() {
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "Test message".to_string(),
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
                assert_eq!(msg.content, "Test message");
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_bus_message_gateway_deliver_serialization() {
        let gateway_id = "gateway-123".to_string();
        let user_id = Uuid::new_v4();
        let message = ChatMessage {
            id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            recipient_id: Some(user_id),
            room_id: None,
            content: "Gateway message".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let bus_msg = BusMessage::GatewayDeliver {
            gateway_id: gateway_id.clone(),
            user_id,
            message,
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::GatewayDeliver {
                gateway_id: gid,
                user_id: uid,
                message: _,
            } => {
                assert_eq!(gid, gateway_id);
                assert_eq!(uid, user_id);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_bus_message_send_push_serialization() {
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
            notification,
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
    fn test_bus_message_presence_update_serialization() {
        let user_id = Uuid::new_v4();

        let bus_msg = BusMessage::PresenceUpdate {
            user_id,
            is_online: true,
            gateway_id: Some("gateway-1".to_string()),
            device_id: Some("device-1".to_string()),
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::PresenceUpdate {
                user_id: uid,
                is_online,
                gateway_id,
                device_id,
            } => {
                assert_eq!(uid, user_id);
                assert!(is_online);
                assert_eq!(gateway_id, Some("gateway-1".to_string()));
                assert_eq!(device_id, Some("device-1".to_string()));
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_bus_message_typing_update_serialization() {
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
    fn test_bus_message_delivery_receipt_serialization() {
        let sender_id = Uuid::new_v4();
        let message_id = Uuid::new_v4();

        let bus_msg = BusMessage::DeliveryReceipt {
            sender_id,
            message_id,
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::DeliveryReceipt {
                sender_id: sid,
                message_id: mid,
            } => {
                assert_eq!(sid, sender_id);
                assert_eq!(mid, message_id);
            }
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_bus_message_read_receipt_serialization() {
        let sender_id = Uuid::new_v4();
        let message_id = Uuid::new_v4();

        let bus_msg = BusMessage::ReadReceipt {
            sender_id,
            message_id,
        };

        let json = serde_json::to_string(&bus_msg).unwrap();
        let deserialized: BusMessage = serde_json::from_str(&json).unwrap();

        match deserialized {
            BusMessage::ReadReceipt {
                sender_id: sid,
                message_id: mid,
            } => {
                assert_eq!(sid, sender_id);
                assert_eq!(mid, message_id);
            }
            _ => panic!("Wrong message type"),
        }
    }
}

#[cfg(test)]
mod config_tests {
    use crate::config::*;
    use std::env;

    #[test]
    fn test_service_config_defaults() {
        // Clear any existing environment variables
        env::remove_var("TEST_HOST");
        env::remove_var("TEST_PORT");
        env::remove_var("TEST_ID");

        let config = ServiceConfig::from_env("TEST").unwrap();
        assert_eq!(config.host, "0.0.0.0");
        assert_eq!(config.port, 8080);
        // service_id should be a valid UUID
        assert!(!config.service_id.is_empty());
    }

    #[test]
    fn test_service_config_from_env() {
        env::set_var("CUSTOM_HOST", "127.0.0.1");
        env::set_var("CUSTOM_PORT", "3000");
        env::set_var("CUSTOM_ID", "custom-service-id");

        let config = ServiceConfig::from_env("CUSTOM").unwrap();
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 3000);
        assert_eq!(config.service_id, "custom-service-id");

        // Cleanup
        env::remove_var("CUSTOM_HOST");
        env::remove_var("CUSTOM_PORT");
        env::remove_var("CUSTOM_ID");
    }

    #[test]
    fn test_redis_config_defaults() {
        env::remove_var("REDIS_URL");
        env::remove_var("REDIS_POOL_SIZE");

        let config = RedisConfig::from_env().unwrap();
        assert_eq!(config.url, "redis://redis:6379");
        assert_eq!(config.pool_size, 10);
    }

    #[test]
    fn test_nats_config_defaults() {
        env::remove_var("NATS_URL");

        let config = NatsConfig::from_env().unwrap();
        assert_eq!(config.url, "nats://nats:4222");
    }

    #[test]
    fn test_scylla_config_multiple_nodes() {
        // Test for custom scylla config (the default test is removed due to env var race conditions)
        env::set_var("SCYLLA_NODES", "node1:9042, node2:9042, node3:9042");
        env::set_var("SCYLLA_KEYSPACE", "test_keyspace");

        let config = ScyllaConfig::from_env().unwrap();
        assert_eq!(config.nodes.len(), 3);
        assert_eq!(config.nodes[0], "node1:9042");
        assert_eq!(config.nodes[1], "node2:9042");
        assert_eq!(config.nodes[2], "node3:9042");
        assert_eq!(config.keyspace, "test_keyspace");

        env::remove_var("SCYLLA_NODES");
        env::remove_var("SCYLLA_KEYSPACE");
    }

    #[test]
    fn test_auth_config_custom() {
        // Test custom auth config (the default test is removed due to env var race conditions)
        env::set_var("JWT_SECRET", "test-secret");
        env::set_var("JWT_EXPIRY_HOURS", "12");
        env::set_var("REFRESH_EXPIRY_DAYS", "7");

        let config = AuthConfig::from_env().unwrap();
        assert_eq!(config.jwt_secret, "test-secret");
        assert_eq!(config.jwt_expiry_hours, 12);
        assert_eq!(config.refresh_expiry_days, 7);

        env::remove_var("JWT_SECRET");
        env::remove_var("JWT_EXPIRY_HOURS");
        env::remove_var("REFRESH_EXPIRY_DAYS");
    }

    #[test]
    fn test_auth_config_with_oauth() {
        env::set_var("OAUTH_GOOGLE_CLIENT_ID", "google-client-id");
        env::set_var("OAUTH_GOOGLE_CLIENT_SECRET", "google-secret");
        env::set_var("OAUTH_GITHUB_CLIENT_ID", "github-client-id");
        env::set_var("OAUTH_GITHUB_CLIENT_SECRET", "github-secret");

        let config = AuthConfig::from_env().unwrap();
        assert_eq!(
            config.oauth_google_client_id,
            Some("google-client-id".to_string())
        );
        assert_eq!(
            config.oauth_google_client_secret,
            Some("google-secret".to_string())
        );
        assert_eq!(
            config.oauth_github_client_id,
            Some("github-client-id".to_string())
        );
        assert_eq!(
            config.oauth_github_client_secret,
            Some("github-secret".to_string())
        );

        env::remove_var("OAUTH_GOOGLE_CLIENT_ID");
        env::remove_var("OAUTH_GOOGLE_CLIENT_SECRET");
        env::remove_var("OAUTH_GITHUB_CLIENT_ID");
        env::remove_var("OAUTH_GITHUB_CLIENT_SECRET");
    }

    #[test]
    fn test_push_provider_config_with_fcm() {
        // Test custom FCM config (default test removed due to env var race conditions)
        env::set_var("FCM_API_KEY", "fcm-test-key");

        let config = PushProviderConfig::from_env().unwrap();
        assert_eq!(config.fcm_api_key, Some("fcm-test-key".to_string()));

        env::remove_var("FCM_API_KEY");
    }

    #[test]
    fn test_push_provider_config_with_apns() {
        env::set_var("APNS_KEY_PATH", "/path/to/key.p8");
        env::set_var("APNS_TEAM_ID", "team-123");
        env::set_var("APNS_KEY_ID", "key-456");

        let config = PushProviderConfig::from_env().unwrap();
        assert_eq!(config.apns_key_path, Some("/path/to/key.p8".to_string()));
        assert_eq!(config.apns_team_id, Some("team-123".to_string()));
        assert_eq!(config.apns_key_id, Some("key-456".to_string()));

        env::remove_var("APNS_KEY_PATH");
        env::remove_var("APNS_TEAM_ID");
        env::remove_var("APNS_KEY_ID");
    }
}

#[cfg(test)]
mod error_tests {
    use crate::error::{AuthError, ServiceError};

    #[test]
    fn test_auth_error_display() {
        let err = AuthError::InvalidCredentials;
        assert_eq!(err.to_string(), "Invalid credentials");

        let err = AuthError::TokenExpired;
        assert_eq!(err.to_string(), "Token expired");

        let err = AuthError::InvalidToken("test reason".to_string());
        assert_eq!(err.to_string(), "Invalid token: test reason");

        let err = AuthError::InvalidTokenType;
        assert_eq!(err.to_string(), "Invalid token type");

        let err = AuthError::TokenCreation("creation failed".to_string());
        assert_eq!(err.to_string(), "Token creation failed: creation failed");

        let err = AuthError::UserNotFound;
        assert_eq!(err.to_string(), "User not found");

        let err = AuthError::UserAlreadyExists;
        assert_eq!(err.to_string(), "User already exists");

        let err = AuthError::OAuthError("oauth failed".to_string());
        assert_eq!(err.to_string(), "OAuth error: oauth failed");

        let err = AuthError::Internal("internal error".to_string());
        assert_eq!(err.to_string(), "Internal error: internal error");
    }

    #[test]
    fn test_service_error_display() {
        let err = ServiceError::Database("db error".to_string());
        assert_eq!(err.to_string(), "Database error: db error");

        let err = ServiceError::Redis("redis error".to_string());
        assert_eq!(err.to_string(), "Redis error: redis error");

        let err = ServiceError::Nats("nats error".to_string());
        assert_eq!(err.to_string(), "NATS error: nats error");

        let err = ServiceError::NotFound("item".to_string());
        assert_eq!(err.to_string(), "Not found: item");

        let err = ServiceError::Validation("invalid input".to_string());
        assert_eq!(err.to_string(), "Validation error: invalid input");

        let err = ServiceError::Internal("internal".to_string());
        assert_eq!(err.to_string(), "Internal error: internal");
    }

    #[test]
    fn test_auth_error_debug() {
        let err = AuthError::InvalidCredentials;
        let debug_str = format!("{:?}", err);
        assert!(debug_str.contains("InvalidCredentials"));
    }

    #[test]
    fn test_service_error_debug() {
        let err = ServiceError::Database("test".to_string());
        let debug_str = format!("{:?}", err);
        assert!(debug_str.contains("Database"));
    }
}

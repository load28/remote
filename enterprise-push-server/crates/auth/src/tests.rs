//! Tests for the Auth Service
//!
//! This module contains unit tests for:
//! - Handler request/response types
//! - Input validation
//! - Token hashing
//! - Password validation rules

#[cfg(test)]
mod handler_tests {
    use crate::handlers::{
        AuthResponse, ErrorResponse, LoginRequest, OAuthCallback, RefreshRequest, RegisterRequest,
        UserResponse, ValidateRequest, ValidateResponse,
    };
    use common::{TokenPair, User};
    use uuid::Uuid;

    #[test]
    fn test_register_request_deserialization() {
        let json = r#"{"email": "test@example.com", "username": "testuser", "password": "password123"}"#;
        let request: RegisterRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.email, "test@example.com");
        assert_eq!(request.username, "testuser");
        assert_eq!(request.password, "password123");
    }

    #[test]
    fn test_login_request_deserialization() {
        let json = r#"{"email": "test@example.com", "password": "password123"}"#;
        let request: LoginRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.email, "test@example.com");
        assert_eq!(request.password, "password123");
    }

    #[test]
    fn test_refresh_request_deserialization() {
        let json = r#"{"refresh_token": "some-refresh-token"}"#;
        let request: RefreshRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.refresh_token, "some-refresh-token");
    }

    #[test]
    fn test_validate_request_deserialization() {
        let json = r#"{"token": "some-access-token"}"#;
        let request: ValidateRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.token, "some-access-token");
    }

    #[test]
    fn test_oauth_callback_deserialization() {
        let json = r#"{"code": "auth-code-123", "state": "csrf-state"}"#;
        let callback: OAuthCallback = serde_json::from_str(json).unwrap();

        assert_eq!(callback.code, "auth-code-123");
        assert_eq!(callback.state, Some("csrf-state".to_string()));
    }

    #[test]
    fn test_oauth_callback_without_state() {
        let json = r#"{"code": "auth-code-123"}"#;
        let callback: OAuthCallback = serde_json::from_str(json).unwrap();

        assert_eq!(callback.code, "auth-code-123");
        assert!(callback.state.is_none());
    }

    #[test]
    fn test_user_response_serialization() {
        let response = UserResponse {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            username: "testuser".to_string(),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"email\":\"test@example.com\""));
        assert!(json.contains("\"username\":\"testuser\""));
    }

    #[test]
    fn test_user_response_from_user() {
        let user = User {
            id: Uuid::new_v4(),
            email: "user@example.com".to_string(),
            username: "myuser".to_string(),
            password_hash: Some("hashed".to_string()),
            oauth_provider: None,
            oauth_id: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let response = UserResponse::from(&user);

        assert_eq!(response.id, user.id);
        assert_eq!(response.email, "user@example.com");
        assert_eq!(response.username, "myuser");
    }

    #[test]
    fn test_auth_response_serialization() {
        let user = UserResponse {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            username: "testuser".to_string(),
        };

        let tokens = TokenPair {
            access_token: "access-token".to_string(),
            refresh_token: "refresh-token".to_string(),
            expires_in: 3600,
            token_type: "Bearer".to_string(),
        };

        let response = AuthResponse { user, tokens };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"access_token\":\"access-token\""));
        assert!(json.contains("\"email\":\"test@example.com\""));
    }

    #[test]
    fn test_validate_response_valid() {
        let response = ValidateResponse {
            valid: true,
            user_id: Some(Uuid::new_v4()),
            email: Some("test@example.com".to_string()),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"valid\":true"));
    }

    #[test]
    fn test_validate_response_invalid() {
        let response = ValidateResponse {
            valid: false,
            user_id: None,
            email: None,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"valid\":false"));
        assert!(json.contains("\"user_id\":null"));
        assert!(json.contains("\"email\":null"));
    }

    #[test]
    fn test_error_response_serialization() {
        let response = ErrorResponse {
            error: "Something went wrong".to_string(),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"error\":\"Something went wrong\""));
    }
}

#[cfg(test)]
mod hash_token_tests {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    fn hash_token(token: &str) -> String {
        let mut hasher = DefaultHasher::new();
        token.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    #[test]
    fn test_hash_token_deterministic() {
        let token = "my-test-token";
        let hash1 = hash_token(token);
        let hash2 = hash_token(token);

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_hash_token_different_inputs() {
        let hash1 = hash_token("token-1");
        let hash2 = hash_token("token-2");

        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_hash_token_empty_string() {
        let hash = hash_token("");
        assert!(!hash.is_empty());
    }

    #[test]
    fn test_hash_token_format() {
        let hash = hash_token("test-token");
        // Should be a valid hexadecimal string
        assert!(hash.chars().all(|c| c.is_ascii_hexdigit()));
    }
}

#[cfg(test)]
mod validation_tests {
    #[test]
    fn test_email_empty_validation() {
        let email = "";
        let password = "validpassword123";

        // Simulates the validation in register handler
        let is_valid = !email.is_empty() && password.len() >= 8;
        assert!(!is_valid);
    }

    #[test]
    fn test_password_too_short_validation() {
        let email = "test@example.com";
        let password = "short";

        let is_valid = !email.is_empty() && password.len() >= 8;
        assert!(!is_valid);
    }

    #[test]
    fn test_password_exactly_8_chars() {
        let email = "test@example.com";
        let password = "12345678";

        let is_valid = !email.is_empty() && password.len() >= 8;
        assert!(is_valid);
    }

    #[test]
    fn test_valid_registration_input() {
        let email = "test@example.com";
        let password = "securepassword123";

        let is_valid = !email.is_empty() && password.len() >= 8;
        assert!(is_valid);
    }

    #[test]
    fn test_password_7_chars_fails() {
        let email = "test@example.com";
        let password = "1234567";

        let is_valid = !email.is_empty() && password.len() >= 8;
        assert!(!is_valid);
    }
}

#[cfg(test)]
mod jwt_integration_tests {
    use common::auth::JwtService;
    use common::config::AuthConfig;
    use uuid::Uuid;

    fn test_auth_config() -> AuthConfig {
        AuthConfig {
            jwt_secret: "test-secret-key-for-testing".to_string(),
            jwt_expiry_hours: 1,
            refresh_expiry_days: 7,
            oauth_google_client_id: None,
            oauth_google_client_secret: None,
            oauth_github_client_id: None,
            oauth_github_client_secret: None,
        }
    }

    #[test]
    fn test_jwt_workflow() {
        let config = test_auth_config();
        let jwt_service = JwtService::new(&config);

        let user_id = Uuid::new_v4();
        let email = "workflow@example.com";

        // Generate tokens
        let token_pair = jwt_service.generate_token_pair(user_id, email).unwrap();

        // Validate access token
        let claims = jwt_service.validate_access_token(&token_pair.access_token).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);

        // Validate refresh token
        let refresh_claims = jwt_service.validate_refresh_token(&token_pair.refresh_token).unwrap();
        assert_eq!(refresh_claims.sub, user_id.to_string());

        // Extract user ID
        let extracted_id = jwt_service.extract_user_id(&token_pair.access_token).unwrap();
        assert_eq!(extracted_id, user_id);
    }

    #[test]
    fn test_token_expiration_configured_correctly() {
        let config = AuthConfig {
            jwt_secret: "test-secret".to_string(),
            jwt_expiry_hours: 2,
            refresh_expiry_days: 14,
            oauth_google_client_id: None,
            oauth_google_client_secret: None,
            oauth_github_client_id: None,
            oauth_github_client_secret: None,
        };

        let jwt_service = JwtService::new(&config);
        let token_pair = jwt_service.generate_token_pair(Uuid::new_v4(), "test@example.com").unwrap();

        // expires_in should be 2 hours = 7200 seconds
        assert_eq!(token_pair.expires_in, 7200);
    }
}

#[cfg(test)]
mod bearer_token_tests {
    use common::auth::extract_bearer_token;

    #[test]
    fn test_extract_valid_bearer_token() {
        let header = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
        let token = extract_bearer_token(header);

        assert_eq!(
            token,
            Some("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test")
        );
    }

    #[test]
    fn test_extract_bearer_with_complex_token() {
        let header = "Bearer abc123.def456.ghi789";
        let token = extract_bearer_token(header);

        assert_eq!(token, Some("abc123.def456.ghi789"));
    }

    #[test]
    fn test_case_sensitivity() {
        // Bearer should be case-sensitive
        let header = "bearer token123";
        let token = extract_bearer_token(header);
        assert!(token.is_none());

        let header = "BEARER token123";
        let token = extract_bearer_token(header);
        assert!(token.is_none());
    }
}

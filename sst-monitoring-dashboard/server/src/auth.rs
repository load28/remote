use async_trait::async_trait;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use std::env;
use std::sync::Once;

use crate::models::auth::{Claims, UserRole};

static JWT_SECRET_WARN: Once = Once::new();

fn jwt_secret() -> String {
    match env::var("JWT_SECRET") {
        Ok(secret) => secret,
        Err(_) => {
            JWT_SECRET_WARN.call_once(|| {
                tracing::warn!("JWT_SECRET not set! Using insecure default. Set JWT_SECRET env var for production.");
            });
            "sst-monitor-default-secret-change-me".to_string()
        }
    }
}

pub fn create_token(user_id: &str, email: &str, role: &UserRole) -> Result<String, String> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .map_err(|e| e.to_string())
}

pub fn validate_token(token: &str) -> Result<Claims, String> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret().as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| e.to_string())
}

/// Extractor that validates JWT from Authorization header
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: String,
    pub email: String,
    pub role: String,
}

impl AuthUser {
    pub fn is_admin(&self) -> bool {
        self.role == "admin"
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        extract_auth_user(parts)
    }
}

fn extract_auth_user(parts: &Parts) -> Result<AuthUser, (StatusCode, axum::Json<serde_json::Value>)> {
    let auth_header = parts
        .headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({"error": "Missing authorization header"})),
            )
        })?;

    let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            axum::Json(serde_json::json!({"error": "Invalid authorization format"})),
        )
    })?;

    let claims = validate_token(token).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            axum::Json(serde_json::json!({"error": "Invalid or expired token"})),
        )
    })?;

    Ok(AuthUser {
        user_id: claims.sub,
        email: claims.email,
        role: claims.role,
    })
}

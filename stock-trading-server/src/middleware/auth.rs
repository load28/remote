use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::sync::Arc;

use crate::services::AuthService;

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: String,
    pub email: String,
    pub username: String,
}

#[derive(Serialize)]
pub struct AuthError {
    pub error: String,
    pub code: String,
}

pub async fn auth_middleware(
    State(auth_service): State<Arc<AuthService>>,
    mut request: Request,
    next: Next,
) -> Response {
    // Extract token from Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());

    let token = match auth_header {
        Some(header) if header.starts_with("Bearer ") => &header[7..],
        _ => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(AuthError {
                    error: "Missing or invalid Authorization header".to_string(),
                    code: "AUTH_REQUIRED".to_string(),
                }),
            )
                .into_response();
        }
    };

    // Verify token
    match auth_service.verify_token(token) {
        Ok(claims) => {
            // Add user info to request extensions
            let user = AuthenticatedUser {
                user_id: claims.sub,
                email: claims.email,
                username: claims.username,
            };
            request.extensions_mut().insert(user);
            next.run(request).await
        }
        Err(e) => (
            StatusCode::UNAUTHORIZED,
            Json(AuthError {
                error: e.to_string(),
                code: "INVALID_TOKEN".to_string(),
            }),
        )
            .into_response(),
    }
}

// Extractor for authenticated user
pub struct CurrentUser(pub AuthenticatedUser);

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for CurrentUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<AuthError>);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthenticatedUser>()
            .cloned()
            .map(CurrentUser)
            .ok_or_else(|| {
                (
                    StatusCode::UNAUTHORIZED,
                    Json(AuthError {
                        error: "User not authenticated".to_string(),
                        code: "AUTH_REQUIRED".to_string(),
                    }),
                )
            })
    }
}

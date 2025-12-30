use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Redirect},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use common::auth::extract_bearer_token;
use common::{TokenPair, User};

use crate::AppState;

// ============ Request/Response Types ============

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct ValidateRequest {
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub tokens: TokenPair,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct ValidateResponse {
    pub valid: bool,
    pub user_id: Option<Uuid>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Deserialize)]
pub struct OAuthCallback {
    pub code: String,
    pub state: Option<String>,
}

impl From<&User> for UserResponse {
    fn from(user: &User) -> Self {
        Self {
            id: user.id,
            email: user.email.clone(),
            username: user.username.clone(),
        }
    }
}

// ============ Handlers ============

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate input
    if req.email.is_empty() || req.password.len() < 8 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid email or password (min 8 chars)".to_string(),
            }),
        ));
    }

    let user = state
        .store
        .create_user(&req.email, &req.username, &req.password)
        .await
        .map_err(|e| {
            (
                StatusCode::CONFLICT,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let tokens = state
        .jwt_service
        .generate_token_pair(user.id, &user.email)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    // Store refresh token hash
    let refresh_hash = hash_token(&tokens.refresh_token);
    let _ = state
        .store
        .store_refresh_token(user.id, &refresh_hash, 30 * 24 * 3600)
        .await;

    Ok(Json(AuthResponse {
        user: UserResponse::from(&user),
        tokens,
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user = state
        .store
        .authenticate(&req.email, &req.password)
        .await
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let tokens = state
        .jwt_service
        .generate_token_pair(user.id, &user.email)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let refresh_hash = hash_token(&tokens.refresh_token);
    let _ = state
        .store
        .store_refresh_token(user.id, &refresh_hash, 30 * 24 * 3600)
        .await;

    Ok(Json(AuthResponse {
        user: UserResponse::from(&user),
        tokens,
    }))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<TokenPair>, (StatusCode, Json<ErrorResponse>)> {
    // Validate refresh token
    let claims = state
        .jwt_service
        .validate_refresh_token(&req.refresh_token)
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    // Verify refresh token is stored
    let refresh_hash = hash_token(&req.refresh_token);
    let _ = state
        .store
        .validate_refresh_token(&refresh_hash)
        .await
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    // Revoke old refresh token
    let _ = state.store.revoke_refresh_token(&refresh_hash).await;

    // Get user
    let user_id = Uuid::parse_str(&claims.sub).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
    })?;

    // Generate new tokens
    let tokens = state
        .jwt_service
        .generate_token_pair(user_id, &claims.email)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    // Store new refresh token
    let new_refresh_hash = hash_token(&tokens.refresh_token);
    let _ = state
        .store
        .store_refresh_token(user_id, &new_refresh_hash, 30 * 24 * 3600)
        .await;

    Ok(Json(tokens))
}

pub async fn logout(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing authorization header".to_string(),
            }),
        ))?;

    let token = extract_bearer_token(auth_header).ok_or((
        StatusCode::UNAUTHORIZED,
        Json(ErrorResponse {
            error: "Invalid authorization header".to_string(),
        }),
    ))?;

    // Blacklist the token
    let _ = state.store.blacklist_token(token, 24 * 3600).await;

    Ok(StatusCode::OK)
}

pub async fn validate_token(
    State(state): State<AppState>,
    Json(req): Json<ValidateRequest>,
) -> Json<ValidateResponse> {
    // Check if blacklisted
    if state
        .store
        .is_token_blacklisted(&req.token)
        .await
        .unwrap_or(false)
    {
        return Json(ValidateResponse {
            valid: false,
            user_id: None,
            email: None,
        });
    }

    match state.jwt_service.validate_access_token(&req.token) {
        Ok(claims) => Json(ValidateResponse {
            valid: true,
            user_id: Uuid::parse_str(&claims.sub).ok(),
            email: Some(claims.email),
        }),
        Err(_) => Json(ValidateResponse {
            valid: false,
            user_id: None,
            email: None,
        }),
    }
}

pub async fn get_current_user(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserResponse>, (StatusCode, Json<ErrorResponse>)> {
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing authorization header".to_string(),
            }),
        ))?;

    let token = extract_bearer_token(auth_header).ok_or((
        StatusCode::UNAUTHORIZED,
        Json(ErrorResponse {
            error: "Invalid authorization header".to_string(),
        }),
    ))?;

    let user_id = state.jwt_service.extract_user_id(token).map_err(|e| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
    })?;

    let user = state
        .store
        .get_user(user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "User not found".to_string(),
            }),
        ))?;

    Ok(Json(UserResponse::from(&user)))
}

// ============ OAuth Handlers ============

pub async fn oauth_google_redirect(
    State(state): State<AppState>,
) -> Result<Redirect, (StatusCode, Json<ErrorResponse>)> {
    let (auth_url, _csrf_token) = state.oauth_providers.google_auth_url().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
    })?;

    Ok(Redirect::to(&auth_url))
}

pub async fn oauth_google_callback(
    State(state): State<AppState>,
    Query(params): Query<OAuthCallback>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_info = state
        .oauth_providers
        .exchange_google_code(&params.code)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let user = state
        .store
        .create_oauth_user(&user_info.email, &user_info.name, "google", &user_info.id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let tokens = state
        .jwt_service
        .generate_token_pair(user.id, &user.email)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let refresh_hash = hash_token(&tokens.refresh_token);
    let _ = state
        .store
        .store_refresh_token(user.id, &refresh_hash, 30 * 24 * 3600)
        .await;

    Ok(Json(AuthResponse {
        user: UserResponse::from(&user),
        tokens,
    }))
}

pub async fn oauth_github_redirect(
    State(state): State<AppState>,
) -> Result<Redirect, (StatusCode, Json<ErrorResponse>)> {
    let (auth_url, _csrf_token) = state.oauth_providers.github_auth_url().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: e.to_string(),
            }),
        )
    })?;

    Ok(Redirect::to(&auth_url))
}

pub async fn oauth_github_callback(
    State(state): State<AppState>,
    Query(params): Query<OAuthCallback>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_info = state
        .oauth_providers
        .exchange_github_code(&params.code)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let email = user_info.email.ok_or((
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse {
            error: "No email found in GitHub account".to_string(),
        }),
    ))?;

    let username = user_info.name.unwrap_or(user_info.login);

    let user = state
        .store
        .create_oauth_user(&email, &username, "github", &user_info.id.to_string())
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let tokens = state
        .jwt_service
        .generate_token_pair(user.id, &user.email)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    let refresh_hash = hash_token(&tokens.refresh_token);
    let _ = state
        .store
        .store_refresh_token(user.id, &refresh_hash, 30 * 24 * 3600)
        .await;

    Ok(Json(AuthResponse {
        user: UserResponse::from(&user),
        tokens,
    }))
}

// ============ Helpers ============

fn hash_token(token: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    token.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

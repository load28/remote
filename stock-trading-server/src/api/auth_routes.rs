use axum::{extract::State, routing::post, Json, Router};
use serde::Deserialize;
use std::sync::Arc;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::middleware::CurrentUser;
use crate::services::{auth_service::AuthResponse, AuthService};

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

pub struct AuthState {
    pub pool: DbPool,
    pub auth_service: Arc<AuthService>,
}

pub fn routes(state: Arc<AuthState>) -> Router {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", post(get_me))
        .with_state(state)
}

async fn register(
    State(state): State<Arc<AuthState>>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<AuthResponse>> {
    let response = state
        .auth_service
        .register(&state.pool, &req.email, &req.password, &req.username)
        .await?;
    Ok(Json(response))
}

async fn login(
    State(state): State<Arc<AuthState>>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    let response = state
        .auth_service
        .login(&state.pool, &req.email, &req.password)
        .await?;
    Ok(Json(response))
}

async fn get_me(
    State(state): State<Arc<AuthState>>,
    current_user: CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    let user = state
        .auth_service
        .get_current_user(&state.pool, &current_user.0.user_id)
        .await?;

    Ok(Json(serde_json::json!({
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.to_rfc3339()
    })))
}

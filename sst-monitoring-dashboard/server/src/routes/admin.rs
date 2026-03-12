use axum::{extract::Path, extract::State, Json};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::app_state::AppState;
use crate::auth::AuthUser;
use crate::db;

pub async fn list_users(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Response {
    if !auth.is_admin() {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({"error": "Admin access required"})),
        )
            .into_response();
    }

    match db::list_users(&state.db) {
        Ok(users) => (StatusCode::OK, Json(users)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e})),
        )
            .into_response(),
    }
}

pub async fn approve_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(user_id): Path<String>,
) -> Response {
    if !auth.is_admin() {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({"error": "Admin access required"})),
        )
            .into_response();
    }

    match db::approve_user(&state.db, &user_id) {
        Ok(user) => {
            tracing::info!("User approved: {} by admin {}", user.email, auth.email);
            (
                StatusCode::OK,
                Json(serde_json::json!({"message": "User approved", "user": user})),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": e})),
        )
            .into_response(),
    }
}

pub async fn reject_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(user_id): Path<String>,
) -> Response {
    if !auth.is_admin() {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({"error": "Admin access required"})),
        )
            .into_response();
    }

    match db::reject_user(&state.db, &user_id) {
        Ok(()) => {
            tracing::info!("User rejected: {} by admin {}", user_id, auth.email);
            (
                StatusCode::OK,
                Json(serde_json::json!({"message": "User rejected"})),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": e})),
        )
            .into_response(),
    }
}

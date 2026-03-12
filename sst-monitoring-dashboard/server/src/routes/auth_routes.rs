use axum::{extract::Query, extract::State, Json};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::app_state::AppState;
use crate::auth::{create_token, AuthUser};
use crate::db;
use crate::email;
use crate::models::auth::*;

pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Response {
    // Validate email format
    if !body.email.contains('@') || body.email.len() < 5 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Invalid email format"})),
        )
            .into_response();
    }

    // Validate password length
    if body.password.len() < 8 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Password must be at least 8 characters"})),
        )
            .into_response();
    }

    // Hash password
    let password_hash = match bcrypt::hash(&body.password, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Failed to hash password: {e}")})),
            )
                .into_response();
        }
    };

    // Generate verification token
    let verification_token = uuid::Uuid::new_v4().to_string();

    // Create user in DB
    let user = match db::create_user(&state.db, &body.email, &password_hash, &verification_token) {
        Ok(u) => u,
        Err(e) => {
            let status = if e.contains("already registered") {
                StatusCode::CONFLICT
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            return (status, Json(serde_json::json!({"error": e}))).into_response();
        }
    };

    // Send verification email (fire-and-forget)
    let email_addr = body.email.clone();
    let token = verification_token.clone();
    tokio::spawn(async move {
        if let Err(e) = email::send_verification_email(&email_addr, &token).await {
            tracing::error!("Failed to send verification email to {}: {}", email_addr, e);
        }
    });

    tracing::info!("User registered: {} (verification token: {})", user.email, verification_token);

    (
        StatusCode::CREATED,
        Json(serde_json::json!({
            "message": "Registration successful. Please check your email to verify your account.",
            "user": user
        })),
    )
        .into_response()
}

pub async fn verify_email(
    State(state): State<AppState>,
    Query(query): Query<VerifyEmailQuery>,
) -> Response {
    match db::verify_email(&state.db, &query.token) {
        Ok(user) => {
            tracing::info!("Email verified for user: {}", user.email);
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "message": "Email verified successfully. Please wait for admin approval to access the dashboard.",
                    "user": user
                })),
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

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Response {
    // Find user by email
    let user = match db::get_user_by_email(&state.db, &body.email) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "Invalid email or password"})),
            )
                .into_response();
        }
    };

    // Verify password
    let valid = bcrypt::verify(&body.password, &user.password_hash).unwrap_or(false);
    if !valid {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "Invalid email or password"})),
        )
            .into_response();
    }

    // Check user status
    match user.status {
        UserStatus::PendingVerification => {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({"error": "Please verify your email first"})),
            )
                .into_response();
        }
        UserStatus::PendingApproval => {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({"error": "Your account is pending admin approval"})),
            )
                .into_response();
        }
        UserStatus::Rejected => {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({"error": "Your account has been rejected"})),
            )
                .into_response();
        }
        UserStatus::Active => {}
    }

    // Generate JWT
    let token = match create_token(&user.id, &user.email, &user.role) {
        Ok(t) => t,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Failed to create token: {e}")})),
            )
                .into_response();
        }
    };

    (StatusCode::OK, Json(AuthResponse { token, user })).into_response()
}

pub async fn me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Response {
    match db::get_user_by_id(&state.db, &auth.user_id) {
        Ok(user) => (StatusCode::OK, Json(user)).into_response(),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": e})),
        )
            .into_response(),
    }
}

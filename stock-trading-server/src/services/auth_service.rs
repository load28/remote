use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::config::Config;
use crate::db::models::User;
use crate::db::repository::{AccountRepository, UserRepository};
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,        // user_id
    pub email: String,
    pub username: String,
    pub exp: i64,           // expiration timestamp
    pub iat: i64,           // issued at timestamp
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub username: String,
    pub created_at: String,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at.to_rfc3339(),
        }
    }
}

pub struct AuthService {
    config: Config,
}

impl AuthService {
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|e| AppError::InternalError(format!("Password hashing failed: {}", e)))
    }

    pub fn verify_password(&self, password: &str, hash: &str) -> AppResult<bool> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AppError::InternalError(format!("Invalid password hash: {}", e)))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    pub fn generate_token(&self, user: &User) -> AppResult<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.config.jwt_expiration_hours);

        let claims = Claims {
            sub: user.id.clone(),
            email: user.email.clone(),
            username: user.username.clone(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::InternalError(format!("Token generation failed: {}", e)))
    }

    pub fn verify_token(&self, token: &str) -> AppResult<Claims> {
        let token_data: TokenData<Claims> = decode(
            token,
            &DecodingKey::from_secret(self.config.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|e| AppError::AuthError(format!("Invalid token: {}", e)))?;

        Ok(token_data.claims)
    }

    pub async fn register(
        &self,
        pool: &SqlitePool,
        email: &str,
        password: &str,
        username: &str,
    ) -> AppResult<AuthResponse> {
        // Validate input
        if email.is_empty() || !email.contains('@') {
            return Err(AppError::ValidationError("Invalid email format".to_string()));
        }
        if password.len() < 8 {
            return Err(AppError::ValidationError(
                "Password must be at least 8 characters".to_string(),
            ));
        }
        if username.len() < 2 {
            return Err(AppError::ValidationError(
                "Username must be at least 2 characters".to_string(),
            ));
        }

        // Check if user exists
        if UserRepository::find_by_email(pool, email).await?.is_some() {
            return Err(AppError::Conflict("Email already registered".to_string()));
        }

        // Hash password
        let password_hash = self.hash_password(password)?;

        // Create user
        let user = UserRepository::create(pool, email, &password_hash, username).await?;

        // Create account with initial balance
        AccountRepository::create(pool, &user.id, self.config.initial_balance).await?;

        // Generate token
        let token = self.generate_token(&user)?;

        Ok(AuthResponse {
            token,
            user: user.into(),
        })
    }

    pub async fn login(
        &self,
        pool: &SqlitePool,
        email: &str,
        password: &str,
    ) -> AppResult<AuthResponse> {
        // Find user
        let user = UserRepository::find_by_email(pool, email)
            .await?
            .ok_or_else(|| AppError::AuthError("Invalid credentials".to_string()))?;

        // Verify password
        if !self.verify_password(password, &user.password_hash)? {
            return Err(AppError::AuthError("Invalid credentials".to_string()));
        }

        // Generate token
        let token = self.generate_token(&user)?;

        Ok(AuthResponse {
            token,
            user: user.into(),
        })
    }

    pub async fn get_current_user(&self, pool: &SqlitePool, user_id: &str) -> AppResult<User> {
        UserRepository::find_by_id(pool, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))
    }
}

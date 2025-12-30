use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use uuid::Uuid;

use common::{RedisConfig, User, AuthError};

const USER_PREFIX: &str = "user:";
const EMAIL_INDEX: &str = "email_to_user:";
const REFRESH_TOKEN_PREFIX: &str = "refresh_token:";
const BLACKLIST_PREFIX: &str = "token_blacklist:";

pub struct AuthStore {
    conn: ConnectionManager,
}

impl AuthStore {
    pub async fn new(config: &RedisConfig) -> anyhow::Result<Self> {
        let client = redis::Client::open(config.url.as_str())?;
        let conn = ConnectionManager::new(client).await?;
        Ok(Self { conn })
    }

    pub async fn create_user(
        &self,
        email: &str,
        username: &str,
        password: &str,
    ) -> Result<User, AuthError> {
        let mut conn = self.conn.clone();

        // Check if email already exists
        let exists: bool = conn
            .exists(format!("{}{}", EMAIL_INDEX, email.to_lowercase()))
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        if exists {
            return Err(AuthError::UserAlreadyExists);
        }

        // Hash password
        let password_hash = self.hash_password(password)?;

        let user = User {
            id: Uuid::new_v4(),
            email: email.to_lowercase(),
            username: username.to_string(),
            password_hash: Some(password_hash),
            oauth_provider: None,
            oauth_id: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        self.save_user(&user).await?;
        Ok(user)
    }

    pub async fn create_oauth_user(
        &self,
        email: &str,
        username: &str,
        provider: &str,
        oauth_id: &str,
    ) -> Result<User, AuthError> {
        let mut conn = self.conn.clone();

        // Check if user already exists with this email
        if let Some(existing) = self.get_user_by_email(email).await? {
            // If user exists with same OAuth provider, return existing
            if existing.oauth_provider.as_deref() == Some(provider) {
                return Ok(existing);
            }
            // If user exists but different auth method, link accounts
            let mut updated = existing;
            updated.oauth_provider = Some(provider.to_string());
            updated.oauth_id = Some(oauth_id.to_string());
            updated.updated_at = chrono::Utc::now();
            self.save_user(&updated).await?;
            return Ok(updated);
        }

        let user = User {
            id: Uuid::new_v4(),
            email: email.to_lowercase(),
            username: username.to_string(),
            password_hash: None,
            oauth_provider: Some(provider.to_string()),
            oauth_id: Some(oauth_id.to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        self.save_user(&user).await?;
        Ok(user)
    }

    pub async fn authenticate(
        &self,
        email: &str,
        password: &str,
    ) -> Result<User, AuthError> {
        let user = self
            .get_user_by_email(email)
            .await?
            .ok_or(AuthError::InvalidCredentials)?;

        let password_hash = user
            .password_hash
            .as_ref()
            .ok_or(AuthError::InvalidCredentials)?;

        self.verify_password(password, password_hash)?;

        Ok(user)
    }

    pub async fn get_user(&self, user_id: Uuid) -> Result<Option<User>, AuthError> {
        let mut conn = self.conn.clone();
        let key = format!("{}{}", USER_PREFIX, user_id);

        let data: Option<String> = conn
            .get(&key)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        match data {
            Some(json) => {
                let user: User = serde_json::from_str(&json)
                    .map_err(|e| AuthError::Internal(e.to_string()))?;
                Ok(Some(user))
            }
            None => Ok(None),
        }
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>, AuthError> {
        let mut conn = self.conn.clone();
        let index_key = format!("{}{}", EMAIL_INDEX, email.to_lowercase());

        let user_id: Option<String> = conn
            .get(&index_key)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        match user_id {
            Some(id) => {
                let uuid = Uuid::parse_str(&id)
                    .map_err(|e| AuthError::Internal(e.to_string()))?;
                self.get_user(uuid).await
            }
            None => Ok(None),
        }
    }

    async fn save_user(&self, user: &User) -> Result<(), AuthError> {
        let mut conn = self.conn.clone();

        let user_key = format!("{}{}", USER_PREFIX, user.id);
        let email_key = format!("{}{}", EMAIL_INDEX, user.email.to_lowercase());

        let user_json = serde_json::to_string(user)
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        redis::pipe()
            .set(&user_key, &user_json)
            .set(&email_key, user.id.to_string())
            .query_async(&mut conn)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        Ok(())
    }

    pub async fn store_refresh_token(
        &self,
        user_id: Uuid,
        token_hash: &str,
        expiry_seconds: u64,
    ) -> Result<(), AuthError> {
        let mut conn = self.conn.clone();
        let key = format!("{}{}", REFRESH_TOKEN_PREFIX, token_hash);

        conn.set_ex(&key, user_id.to_string(), expiry_seconds)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        Ok(())
    }

    pub async fn validate_refresh_token(&self, token_hash: &str) -> Result<Uuid, AuthError> {
        let mut conn = self.conn.clone();
        let key = format!("{}{}", REFRESH_TOKEN_PREFIX, token_hash);

        let user_id: Option<String> = conn
            .get(&key)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        match user_id {
            Some(id) => Uuid::parse_str(&id).map_err(|e| AuthError::Internal(e.to_string())),
            None => Err(AuthError::InvalidToken("Refresh token not found".to_string())),
        }
    }

    pub async fn revoke_refresh_token(&self, token_hash: &str) -> Result<(), AuthError> {
        let mut conn = self.conn.clone();
        let key = format!("{}{}", REFRESH_TOKEN_PREFIX, token_hash);

        conn.del(&key)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        Ok(())
    }

    pub async fn blacklist_token(&self, token: &str, expiry_seconds: u64) -> Result<(), AuthError> {
        let mut conn = self.conn.clone();
        let key = format!("{}{}", BLACKLIST_PREFIX, token);

        conn.set_ex(&key, "1", expiry_seconds)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        Ok(())
    }

    pub async fn is_token_blacklisted(&self, token: &str) -> Result<bool, AuthError> {
        let mut conn = self.conn.clone();
        let key = format!("{}{}", BLACKLIST_PREFIX, token);

        let exists: bool = conn
            .exists(&key)
            .await
            .map_err(|e| AuthError::Internal(e.to_string()))?;

        Ok(exists)
    }

    fn hash_password(&self, password: &str) -> Result<String, AuthError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|e| AuthError::Internal(e.to_string()))
    }

    fn verify_password(&self, password: &str, hash: &str) -> Result<(), AuthError> {
        let parsed_hash =
            PasswordHash::new(hash).map_err(|e| AuthError::Internal(e.to_string()))?;

        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .map_err(|_| AuthError::InvalidCredentials)
    }
}

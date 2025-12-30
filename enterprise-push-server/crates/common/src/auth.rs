use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

use crate::config::AuthConfig;
use crate::types::{Claims, TokenPair, TokenType};
use crate::error::AuthError;

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    access_expiry_hours: i64,
    refresh_expiry_days: i64,
}

impl JwtService {
    pub fn new(config: &AuthConfig) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(config.jwt_secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(config.jwt_secret.as_bytes()),
            access_expiry_hours: config.jwt_expiry_hours,
            refresh_expiry_days: config.refresh_expiry_days,
        }
    }

    pub fn generate_token_pair(&self, user_id: Uuid, email: &str) -> Result<TokenPair, AuthError> {
        let now = chrono::Utc::now().timestamp();
        let access_exp = now + (self.access_expiry_hours * 3600);
        let refresh_exp = now + (self.refresh_expiry_days * 86400);

        let access_claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            exp: access_exp,
            iat: now,
            token_type: TokenType::Access,
        };

        let refresh_claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            exp: refresh_exp,
            iat: now,
            token_type: TokenType::Refresh,
        };

        let access_token = encode(&Header::default(), &access_claims, &self.encoding_key)
            .map_err(|e| AuthError::TokenCreation(e.to_string()))?;

        let refresh_token = encode(&Header::default(), &refresh_claims, &self.encoding_key)
            .map_err(|e| AuthError::TokenCreation(e.to_string()))?;

        Ok(TokenPair {
            access_token,
            refresh_token,
            expires_in: self.access_expiry_hours * 3600,
            token_type: "Bearer".to_string(),
        })
    }

    pub fn validate_access_token(&self, token: &str) -> Result<Claims, AuthError> {
        let claims = self.decode_token(token)?;

        if claims.token_type != TokenType::Access {
            return Err(AuthError::InvalidTokenType);
        }

        Ok(claims)
    }

    pub fn validate_refresh_token(&self, token: &str) -> Result<Claims, AuthError> {
        let claims = self.decode_token(token)?;

        if claims.token_type != TokenType::Refresh {
            return Err(AuthError::InvalidTokenType);
        }

        Ok(claims)
    }

    fn decode_token(&self, token: &str) -> Result<Claims, AuthError> {
        let token_data = decode::<Claims>(token, &self.decoding_key, &Validation::default())
            .map_err(|e| match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
                _ => AuthError::InvalidToken(e.to_string()),
            })?;

        Ok(token_data.claims)
    }

    pub fn extract_user_id(&self, token: &str) -> Result<Uuid, AuthError> {
        let claims = self.validate_access_token(token)?;
        Uuid::parse_str(&claims.sub).map_err(|e| AuthError::InvalidToken(e.to_string()))
    }
}

// Middleware helper for extracting and validating tokens
pub fn extract_bearer_token(auth_header: &str) -> Option<&str> {
    if auth_header.starts_with("Bearer ") {
        Some(&auth_header[7..])
    } else {
        None
    }
}

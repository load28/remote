use oauth2::{
    basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl,
    AuthorizationCode, CsrfToken, Scope, TokenResponse,
};
use serde::Deserialize;

use common::{AuthConfig, AuthError};

pub struct OAuthProviders {
    pub google: Option<BasicClient>,
    pub github: Option<BasicClient>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleUserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GithubUserInfo {
    pub id: i64,
    pub login: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GithubEmail {
    pub email: String,
    pub primary: bool,
    pub verified: bool,
}

impl OAuthProviders {
    pub fn new(config: &AuthConfig) -> anyhow::Result<Self> {
        let google = Self::create_google_client(config)?;
        let github = Self::create_github_client(config)?;

        Ok(Self { google, github })
    }

    fn create_google_client(config: &AuthConfig) -> anyhow::Result<Option<BasicClient>> {
        let (client_id, client_secret) = match (
            &config.oauth_google_client_id,
            &config.oauth_google_client_secret,
        ) {
            (Some(id), Some(secret)) => (id.clone(), secret.clone()),
            _ => return Ok(None),
        };

        let redirect_url = std::env::var("OAUTH_GOOGLE_REDIRECT_URL")
            .unwrap_or_else(|_| "http://localhost:8081/oauth/google/callback".to_string());

        let client = BasicClient::new(
            ClientId::new(client_id),
            Some(ClientSecret::new(client_secret)),
            AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())?,
            Some(TokenUrl::new(
                "https://oauth2.googleapis.com/token".to_string(),
            )?),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_url)?);

        Ok(Some(client))
    }

    fn create_github_client(config: &AuthConfig) -> anyhow::Result<Option<BasicClient>> {
        let (client_id, client_secret) = match (
            &config.oauth_github_client_id,
            &config.oauth_github_client_secret,
        ) {
            (Some(id), Some(secret)) => (id.clone(), secret.clone()),
            _ => return Ok(None),
        };

        let redirect_url = std::env::var("OAUTH_GITHUB_REDIRECT_URL")
            .unwrap_or_else(|_| "http://localhost:8081/oauth/github/callback".to_string());

        let client = BasicClient::new(
            ClientId::new(client_id),
            Some(ClientSecret::new(client_secret)),
            AuthUrl::new("https://github.com/login/oauth/authorize".to_string())?,
            Some(TokenUrl::new(
                "https://github.com/login/oauth/access_token".to_string(),
            )?),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_url)?);

        Ok(Some(client))
    }

    pub fn google_auth_url(&self) -> Result<(String, CsrfToken), AuthError> {
        let client = self
            .google
            .as_ref()
            .ok_or_else(|| AuthError::OAuthError("Google OAuth not configured".to_string()))?;

        let (auth_url, csrf_token) = client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("openid".to_string()))
            .add_scope(Scope::new("email".to_string()))
            .add_scope(Scope::new("profile".to_string()))
            .url();

        Ok((auth_url.to_string(), csrf_token))
    }

    pub fn github_auth_url(&self) -> Result<(String, CsrfToken), AuthError> {
        let client = self
            .github
            .as_ref()
            .ok_or_else(|| AuthError::OAuthError("GitHub OAuth not configured".to_string()))?;

        let (auth_url, csrf_token) = client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("user:email".to_string()))
            .add_scope(Scope::new("read:user".to_string()))
            .url();

        Ok((auth_url.to_string(), csrf_token))
    }

    pub async fn exchange_google_code(&self, code: &str) -> Result<GoogleUserInfo, AuthError> {
        let client = self
            .google
            .as_ref()
            .ok_or_else(|| AuthError::OAuthError("Google OAuth not configured".to_string()))?;

        let http_client = reqwest::Client::new();

        let token = client
            .exchange_code(AuthorizationCode::new(code.to_string()))
            .request_async(|req| async {
                let response = http_client
                    .request(req.method().clone(), req.url().as_str())
                    .headers(req.headers().clone())
                    .body(req.body().clone())
                    .send()
                    .await
                    .map_err(|e| oauth2::reqwest::Error::Reqwest(e))?;

                let status = response.status();
                let headers = response.headers().clone();
                let body = response.bytes().await
                    .map_err(|e| oauth2::reqwest::Error::Reqwest(e))?;

                Ok(oauth2::HttpResponse {
                    status_code: status,
                    headers,
                    body: body.to_vec(),
                })
            })
            .await
            .map_err(|e| AuthError::OAuthError(e.to_string()))?;

        let access_token = token.access_token().secret();

        let user_info: GoogleUserInfo = http_client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| AuthError::OAuthError(e.to_string()))?
            .json()
            .await
            .map_err(|e| AuthError::OAuthError(e.to_string()))?;

        Ok(user_info)
    }

    pub async fn exchange_github_code(&self, code: &str) -> Result<GithubUserInfo, AuthError> {
        let client = self
            .github
            .as_ref()
            .ok_or_else(|| AuthError::OAuthError("GitHub OAuth not configured".to_string()))?;

        let http_client = reqwest::Client::new();

        let token = client
            .exchange_code(AuthorizationCode::new(code.to_string()))
            .request_async(|req| async {
                let response = http_client
                    .request(req.method().clone(), req.url().as_str())
                    .headers(req.headers().clone())
                    .body(req.body().clone())
                    .send()
                    .await
                    .map_err(|e| oauth2::reqwest::Error::Reqwest(e))?;

                let status = response.status();
                let headers = response.headers().clone();
                let body = response.bytes().await
                    .map_err(|e| oauth2::reqwest::Error::Reqwest(e))?;

                Ok(oauth2::HttpResponse {
                    status_code: status,
                    headers,
                    body: body.to_vec(),
                })
            })
            .await
            .map_err(|e| AuthError::OAuthError(e.to_string()))?;

        let access_token = token.access_token().secret();

        let mut user_info: GithubUserInfo = http_client
            .get("https://api.github.com/user")
            .header("User-Agent", "enterprise-push-server")
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| AuthError::OAuthError(e.to_string()))?
            .json()
            .await
            .map_err(|e| AuthError::OAuthError(e.to_string()))?;

        // Get primary email if not public
        if user_info.email.is_none() {
            let emails: Vec<GithubEmail> = http_client
                .get("https://api.github.com/user/emails")
                .header("User-Agent", "enterprise-push-server")
                .bearer_auth(access_token)
                .send()
                .await
                .map_err(|e| AuthError::OAuthError(e.to_string()))?
                .json()
                .await
                .map_err(|e| AuthError::OAuthError(e.to_string()))?;

            user_info.email = emails
                .into_iter()
                .find(|e| e.primary && e.verified)
                .map(|e| e.email);
        }

        Ok(user_info)
    }
}

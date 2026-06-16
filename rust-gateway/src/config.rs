use std::env;
use std::net::SocketAddr;

#[derive(Debug, Clone)]
pub struct Config {
    pub gateway_addr: SocketAddr,
    pub backend_servers: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        dotenvy::dotenv().ok();

        let host = env::var("GATEWAY_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let port: u16 = env::var("GATEWAY_PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse()
            .map_err(|_| ConfigError::InvalidPort)?;

        let gateway_addr: SocketAddr = format!("{}:{}", host, port)
            .parse()
            .map_err(|_| ConfigError::InvalidAddress)?;

        let backend_servers: Vec<String> = env::var("BACKEND_SERVERS")
            .map_err(|_| ConfigError::MissingBackendServers)?
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        if backend_servers.is_empty() {
            return Err(ConfigError::MissingBackendServers);
        }

        Ok(Config {
            gateway_addr,
            backend_servers,
        })
    }
}

#[derive(Debug)]
pub enum ConfigError {
    InvalidPort,
    InvalidAddress,
    MissingBackendServers,
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::InvalidPort => write!(f, "Invalid GATEWAY_PORT value"),
            ConfigError::InvalidAddress => write!(f, "Invalid gateway address"),
            ConfigError::MissingBackendServers => write!(f, "BACKEND_SERVERS is required"),
        }
    }
}

impl std::error::Error for ConfigError {}

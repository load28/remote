use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub server_host: String,
    pub server_port: u16,
    pub initial_balance: f64,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite:stock_trading.db?mode=rwc".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "super-secret-jwt-key-change-in-production".to_string()),
            jwt_expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .unwrap_or(24),
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            initial_balance: env::var("INITIAL_BALANCE")
                .unwrap_or_else(|_| "10000000".to_string())
                .parse()
                .unwrap_or(10_000_000.0), // 1천만원 초기 자금
        }
    }

    pub fn server_addr(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}

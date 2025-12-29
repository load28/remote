pub mod models;
pub mod repository;

use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use crate::config::Config;

pub type DbPool = Pool<Sqlite>;

pub async fn init_db(config: &Config) -> Result<DbPool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    // Run migrations
    run_migrations(&pool).await?;

    // Seed initial data if needed
    seed_initial_data(&pool).await?;

    Ok(pool)
}

async fn run_migrations(pool: &DbPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Accounts table
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            total_deposit REAL NOT NULL DEFAULT 0,
            total_withdraw REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Stocks table
        CREATE TABLE IF NOT EXISTS stocks (
            id TEXT PRIMARY KEY,
            symbol TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            market TEXT NOT NULL,
            sector TEXT NOT NULL DEFAULT 'Unknown',
            current_price REAL NOT NULL,
            previous_close REAL NOT NULL,
            open_price REAL NOT NULL,
            high_price REAL NOT NULL,
            low_price REAL NOT NULL,
            volume INTEGER NOT NULL DEFAULT 0,
            market_cap REAL NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Price history table
        CREATE TABLE IF NOT EXISTS price_history (
            id TEXT PRIMARY KEY,
            stock_id TEXT NOT NULL,
            open_price REAL NOT NULL,
            high_price REAL NOT NULL,
            low_price REAL NOT NULL,
            close_price REAL NOT NULL,
            volume INTEGER NOT NULL,
            recorded_at TEXT NOT NULL,
            FOREIGN KEY (stock_id) REFERENCES stocks(id)
        );

        -- Orders table
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            stock_id TEXT NOT NULL,
            order_type TEXT NOT NULL,
            order_side TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            filled_quantity INTEGER NOT NULL DEFAULT 0,
            price REAL,
            average_price REAL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            expires_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (stock_id) REFERENCES stocks(id)
        );

        -- Holdings table
        CREATE TABLE IF NOT EXISTS holdings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            stock_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            average_price REAL NOT NULL,
            total_invested REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, stock_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (stock_id) REFERENCES stocks(id)
        );

        -- Transactions table
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            stock_id TEXT,
            order_id TEXT,
            transaction_type TEXT NOT NULL,
            quantity INTEGER,
            price REAL,
            amount REAL NOT NULL,
            balance_after REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (stock_id) REFERENCES stocks(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_stock_id ON orders(stock_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_price_history_stock_id ON price_history(stock_id);
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn seed_initial_data(pool: &DbPool) -> Result<(), sqlx::Error> {
    // Check if stocks already exist
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM stocks")
        .fetch_one(pool)
        .await?;

    if count.0 > 0 {
        return Ok(());
    }

    // Seed Korean stocks (KOSPI/KOSDAQ)
    let korean_stocks: Vec<(&str, &str, &str, &str, f64)> = vec![
        ("005930", "삼성전자", "KOSPI", "전자", 71500.0),
        ("000660", "SK하이닉스", "KOSPI", "반도체", 178000.0),
        ("035420", "NAVER", "KOSPI", "인터넷", 214000.0),
        ("035720", "카카오", "KOSPI", "인터넷", 47850.0),
        ("051910", "LG화학", "KOSPI", "화학", 390000.0),
        ("006400", "삼성SDI", "KOSPI", "전자", 410000.0),
        ("003670", "포스코퓨처엠", "KOSPI", "철강", 285000.0),
        ("028260", "삼성물산", "KOSPI", "건설", 130000.0),
        ("105560", "KB금융", "KOSPI", "금융", 78500.0),
        ("055550", "신한지주", "KOSPI", "금융", 51400.0),
        ("068270", "셀트리온", "KOSPI", "바이오", 175000.0),
        ("207940", "삼성바이오로직스", "KOSPI", "바이오", 807000.0),
        ("247540", "에코프로비엠", "KOSDAQ", "2차전지", 125000.0),
        ("086520", "에코프로", "KOSDAQ", "2차전지", 85000.0),
        ("293490", "카카오게임즈", "KOSDAQ", "게임", 18500.0),
    ];

    // Seed US stocks
    let us_stocks: Vec<(&str, &str, &str, &str, f64)> = vec![
        ("AAPL", "Apple Inc.", "NASDAQ", "Technology", 182.50),
        ("MSFT", "Microsoft Corporation", "NASDAQ", "Technology", 378.90),
        ("GOOGL", "Alphabet Inc.", "NASDAQ", "Technology", 141.80),
        ("AMZN", "Amazon.com Inc.", "NASDAQ", "Consumer", 178.25),
        ("NVDA", "NVIDIA Corporation", "NASDAQ", "Semiconductor", 495.80),
        ("META", "Meta Platforms Inc.", "NASDAQ", "Technology", 505.75),
        ("TSLA", "Tesla Inc.", "NASDAQ", "Automotive", 248.50),
        ("BRK.B", "Berkshire Hathaway", "NYSE", "Financial", 408.90),
        ("JPM", "JPMorgan Chase", "NYSE", "Financial", 195.45),
        ("V", "Visa Inc.", "NYSE", "Financial", 279.80),
    ];

    let total_stocks = korean_stocks.len() + us_stocks.len();

    for (symbol, name, market, sector, price) in korean_stocks {
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO stocks (id, symbol, name, market, sector, current_price, previous_close, open_price, high_price, low_price, volume, market_cap)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(symbol)
        .bind(name)
        .bind(market)
        .bind(sector)
        .bind(price)
        .bind(price * 0.99)  // previous_close
        .bind(price * 0.995) // open
        .bind(price * 1.02)  // high
        .bind(price * 0.98)  // low
        .bind(1_000_000i64)  // volume
        .bind(price * 1_000_000_000.0) // market_cap
        .execute(pool)
        .await?;
    }

    for (symbol, name, market, sector, price) in us_stocks {
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO stocks (id, symbol, name, market, sector, current_price, previous_close, open_price, high_price, low_price, volume, market_cap)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(symbol)
        .bind(name)
        .bind(market)
        .bind(sector)
        .bind(price)
        .bind(price * 0.99)
        .bind(price * 0.995)
        .bind(price * 1.02)
        .bind(price * 0.98)
        .bind(5_000_000i64)
        .bind(price * 10_000_000_000.0)
        .execute(pool)
        .await?;
    }

    tracing::info!("Seeded {} stocks", total_stocks);
    Ok(())
}

use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

use super::models::*;
use crate::error::{AppError, AppResult};

// ============================================================================
// User Repository
// ============================================================================

pub struct UserRepository;

impl UserRepository {
    pub async fn create(
        pool: &SqlitePool,
        email: &str,
        password_hash: &str,
        username: &str,
    ) -> AppResult<User> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO users (id, email, password_hash, username, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(email)
        .bind(password_hash)
        .bind(username)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::InternalError("Failed to create user".to_string()))
    }

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await?;
        Ok(user)
    }

    pub async fn find_by_email(pool: &SqlitePool, email: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
            .bind(email)
            .fetch_optional(pool)
            .await?;
        Ok(user)
    }
}

// ============================================================================
// Account Repository
// ============================================================================

pub struct AccountRepository;

impl AccountRepository {
    pub async fn create(pool: &SqlitePool, user_id: &str, initial_balance: f64) -> AppResult<Account> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO accounts (id, user_id, balance, total_deposit, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(user_id)
        .bind(initial_balance)
        .bind(initial_balance)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Self::find_by_user_id(pool, user_id)
            .await?
            .ok_or_else(|| AppError::InternalError("Failed to create account".to_string()))
    }

    pub async fn find_by_user_id(pool: &SqlitePool, user_id: &str) -> AppResult<Option<Account>> {
        let account = sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE user_id = ?")
            .bind(user_id)
            .fetch_optional(pool)
            .await?;
        Ok(account)
    }

    pub async fn update_balance(
        pool: &SqlitePool,
        user_id: &str,
        new_balance: f64,
    ) -> AppResult<()> {
        sqlx::query("UPDATE accounts SET balance = ?, updated_at = ? WHERE user_id = ?")
            .bind(new_balance)
            .bind(Utc::now())
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn deposit(pool: &SqlitePool, user_id: &str, amount: f64) -> AppResult<Account> {
        let account = Self::find_by_user_id(pool, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Account not found".to_string()))?;

        let new_balance = account.balance + amount;
        let new_total_deposit = account.total_deposit + amount;

        sqlx::query(
            "UPDATE accounts SET balance = ?, total_deposit = ?, updated_at = ? WHERE user_id = ?",
        )
        .bind(new_balance)
        .bind(new_total_deposit)
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await?;

        Self::find_by_user_id(pool, user_id)
            .await?
            .ok_or_else(|| AppError::InternalError("Failed to update account".to_string()))
    }

    pub async fn withdraw(pool: &SqlitePool, user_id: &str, amount: f64) -> AppResult<Account> {
        let account = Self::find_by_user_id(pool, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Account not found".to_string()))?;

        if account.balance < amount {
            return Err(AppError::InsufficientFunds(format!(
                "Insufficient balance: {} < {}",
                account.balance, amount
            )));
        }

        let new_balance = account.balance - amount;
        let new_total_withdraw = account.total_withdraw + amount;

        sqlx::query(
            "UPDATE accounts SET balance = ?, total_withdraw = ?, updated_at = ? WHERE user_id = ?",
        )
        .bind(new_balance)
        .bind(new_total_withdraw)
        .bind(Utc::now())
        .bind(user_id)
        .execute(pool)
        .await?;

        Self::find_by_user_id(pool, user_id)
            .await?
            .ok_or_else(|| AppError::InternalError("Failed to update account".to_string()))
    }
}

// ============================================================================
// Stock Repository
// ============================================================================

pub struct StockRepository;

impl StockRepository {
    pub async fn find_all(pool: &SqlitePool) -> AppResult<Vec<Stock>> {
        let stocks = sqlx::query_as::<_, Stock>("SELECT * FROM stocks WHERE is_active = 1 ORDER BY symbol")
            .fetch_all(pool)
            .await?;
        Ok(stocks)
    }

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> AppResult<Option<Stock>> {
        let stock = sqlx::query_as::<_, Stock>("SELECT * FROM stocks WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await?;
        Ok(stock)
    }

    pub async fn find_by_symbol(pool: &SqlitePool, symbol: &str) -> AppResult<Option<Stock>> {
        let stock = sqlx::query_as::<_, Stock>("SELECT * FROM stocks WHERE symbol = ?")
            .bind(symbol)
            .fetch_optional(pool)
            .await?;
        Ok(stock)
    }

    pub async fn find_by_market(pool: &SqlitePool, market: &str) -> AppResult<Vec<Stock>> {
        let stocks = sqlx::query_as::<_, Stock>(
            "SELECT * FROM stocks WHERE market = ? AND is_active = 1 ORDER BY symbol",
        )
        .bind(market)
        .fetch_all(pool)
        .await?;
        Ok(stocks)
    }

    pub async fn search(pool: &SqlitePool, query: &str) -> AppResult<Vec<Stock>> {
        let search_pattern = format!("%{}%", query);
        let stocks = sqlx::query_as::<_, Stock>(
            "SELECT * FROM stocks WHERE (symbol LIKE ? OR name LIKE ?) AND is_active = 1 ORDER BY symbol LIMIT 20",
        )
        .bind(&search_pattern)
        .bind(&search_pattern)
        .fetch_all(pool)
        .await?;
        Ok(stocks)
    }

    pub async fn update_price(
        pool: &SqlitePool,
        stock_id: &str,
        new_price: f64,
        volume_delta: i64,
    ) -> AppResult<()> {
        let stock = Self::find_by_id(pool, stock_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Stock not found".to_string()))?;

        let high = if new_price > stock.high_price {
            new_price
        } else {
            stock.high_price
        };
        let low = if new_price < stock.low_price {
            new_price
        } else {
            stock.low_price
        };

        sqlx::query(
            r#"
            UPDATE stocks
            SET current_price = ?, high_price = ?, low_price = ?, volume = volume + ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(new_price)
        .bind(high)
        .bind(low)
        .bind(volume_delta)
        .bind(Utc::now())
        .bind(stock_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn add_price_history(
        pool: &SqlitePool,
        stock_id: &str,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: i64,
        recorded_at: DateTime<Utc>,
    ) -> AppResult<()> {
        let id = Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO price_history (id, stock_id, open_price, high_price, low_price, close_price, volume, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(stock_id)
        .bind(open)
        .bind(high)
        .bind(low)
        .bind(close)
        .bind(volume)
        .bind(recorded_at)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn get_price_history(
        pool: &SqlitePool,
        stock_id: &str,
        limit: i32,
    ) -> AppResult<Vec<PriceHistory>> {
        let history = sqlx::query_as::<_, PriceHistory>(
            "SELECT * FROM price_history WHERE stock_id = ? ORDER BY recorded_at DESC LIMIT ?",
        )
        .bind(stock_id)
        .bind(limit)
        .fetch_all(pool)
        .await?;
        Ok(history)
    }
}

// ============================================================================
// Order Repository
// ============================================================================

pub struct OrderRepository;

impl OrderRepository {
    pub async fn create(
        pool: &SqlitePool,
        user_id: &str,
        stock_id: &str,
        order_type: OrderType,
        order_side: OrderSide,
        quantity: i64,
        price: Option<f64>,
    ) -> AppResult<Order> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO orders (id, user_id, stock_id, order_type, order_side, quantity, price, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            "#,
        )
        .bind(&id)
        .bind(user_id)
        .bind(stock_id)
        .bind(order_type.as_str())
        .bind(order_side.as_str())
        .bind(quantity)
        .bind(price)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::InternalError("Failed to create order".to_string()))
    }

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> AppResult<Option<Order>> {
        let order = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await?;
        Ok(order)
    }

    pub async fn find_by_user(
        pool: &SqlitePool,
        user_id: &str,
        status: Option<&str>,
        limit: i32,
    ) -> AppResult<Vec<Order>> {
        let orders = if let Some(status) = status {
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(user_id)
            .bind(status)
            .bind(limit)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(user_id)
            .bind(limit)
            .fetch_all(pool)
            .await?
        };
        Ok(orders)
    }

    pub async fn find_pending_orders(
        pool: &SqlitePool,
        stock_id: &str,
        order_side: OrderSide,
    ) -> AppResult<Vec<Order>> {
        let side_str = order_side.as_str();
        let order_by = match order_side {
            OrderSide::Buy => "price DESC, created_at ASC",  // 매수: 높은 가격 우선
            OrderSide::Sell => "price ASC, created_at ASC",  // 매도: 낮은 가격 우선
        };

        let query = format!(
            "SELECT * FROM orders WHERE stock_id = ? AND order_side = ? AND status IN ('pending', 'partial') AND order_type = 'limit' ORDER BY {}",
            order_by
        );

        let orders = sqlx::query_as::<_, Order>(&query)
            .bind(stock_id)
            .bind(side_str)
            .fetch_all(pool)
            .await?;
        Ok(orders)
    }

    pub async fn update_order_fill(
        pool: &SqlitePool,
        order_id: &str,
        filled_quantity: i64,
        average_price: f64,
        status: OrderStatus,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE orders SET filled_quantity = ?, average_price = ?, status = ?, updated_at = ? WHERE id = ?",
        )
        .bind(filled_quantity)
        .bind(average_price)
        .bind(status.as_str())
        .bind(Utc::now())
        .bind(order_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn cancel_order(pool: &SqlitePool, order_id: &str) -> AppResult<()> {
        sqlx::query("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?")
            .bind(Utc::now())
            .bind(order_id)
            .execute(pool)
            .await?;
        Ok(())
    }
}

// ============================================================================
// Holding Repository
// ============================================================================

pub struct HoldingRepository;

impl HoldingRepository {
    pub async fn find_by_user(pool: &SqlitePool, user_id: &str) -> AppResult<Vec<Holding>> {
        let holdings = sqlx::query_as::<_, Holding>(
            "SELECT * FROM holdings WHERE user_id = ? AND quantity > 0 ORDER BY created_at",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;
        Ok(holdings)
    }

    pub async fn find_by_user_and_stock(
        pool: &SqlitePool,
        user_id: &str,
        stock_id: &str,
    ) -> AppResult<Option<Holding>> {
        let holding = sqlx::query_as::<_, Holding>(
            "SELECT * FROM holdings WHERE user_id = ? AND stock_id = ?",
        )
        .bind(user_id)
        .bind(stock_id)
        .fetch_optional(pool)
        .await?;
        Ok(holding)
    }

    pub async fn upsert(
        pool: &SqlitePool,
        user_id: &str,
        stock_id: &str,
        quantity_delta: i64,
        price: f64,
    ) -> AppResult<Holding> {
        let existing = Self::find_by_user_and_stock(pool, user_id, stock_id).await?;
        let now = Utc::now();

        if let Some(holding) = existing {
            let new_quantity = holding.quantity + quantity_delta;

            if new_quantity <= 0 {
                // Delete holding if quantity becomes zero or negative
                sqlx::query("DELETE FROM holdings WHERE id = ?")
                    .bind(&holding.id)
                    .execute(pool)
                    .await?;
                return Ok(Holding {
                    id: holding.id,
                    user_id: user_id.to_string(),
                    stock_id: stock_id.to_string(),
                    quantity: 0,
                    average_price: 0.0,
                    total_invested: 0.0,
                    created_at: holding.created_at,
                    updated_at: now,
                });
            }

            // Calculate new average price (only for buys)
            let (new_avg_price, new_total_invested) = if quantity_delta > 0 {
                let additional_investment = quantity_delta as f64 * price;
                let new_total = holding.total_invested + additional_investment;
                let new_avg = new_total / new_quantity as f64;
                (new_avg, new_total)
            } else {
                // For sells, reduce total_invested proportionally
                let sell_ratio = (-quantity_delta) as f64 / holding.quantity as f64;
                let reduced_investment = holding.total_invested * (1.0 - sell_ratio);
                (holding.average_price, reduced_investment)
            };

            sqlx::query(
                "UPDATE holdings SET quantity = ?, average_price = ?, total_invested = ?, updated_at = ? WHERE id = ?",
            )
            .bind(new_quantity)
            .bind(new_avg_price)
            .bind(new_total_invested)
            .bind(now)
            .bind(&holding.id)
            .execute(pool)
            .await?;

            Self::find_by_user_and_stock(pool, user_id, stock_id)
                .await?
                .ok_or_else(|| AppError::InternalError("Failed to update holding".to_string()))
        } else {
            // Create new holding
            if quantity_delta <= 0 {
                return Err(AppError::InsufficientShares(
                    "Cannot sell shares you don't own".to_string(),
                ));
            }

            let id = Uuid::new_v4().to_string();
            let total_invested = quantity_delta as f64 * price;

            sqlx::query(
                r#"
                INSERT INTO holdings (id, user_id, stock_id, quantity, average_price, total_invested, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(&id)
            .bind(user_id)
            .bind(stock_id)
            .bind(quantity_delta)
            .bind(price)
            .bind(total_invested)
            .bind(now)
            .bind(now)
            .execute(pool)
            .await?;

            Self::find_by_user_and_stock(pool, user_id, stock_id)
                .await?
                .ok_or_else(|| AppError::InternalError("Failed to create holding".to_string()))
        }
    }
}

// ============================================================================
// Transaction Repository
// ============================================================================

pub struct TransactionRepository;

impl TransactionRepository {
    pub async fn create(
        pool: &SqlitePool,
        user_id: &str,
        stock_id: Option<&str>,
        order_id: Option<&str>,
        transaction_type: TransactionType,
        quantity: Option<i64>,
        price: Option<f64>,
        amount: f64,
        balance_after: f64,
    ) -> AppResult<Transaction> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO transactions (id, user_id, stock_id, order_id, transaction_type, quantity, price, amount, balance_after, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(user_id)
        .bind(stock_id)
        .bind(order_id)
        .bind(transaction_type.as_str())
        .bind(quantity)
        .bind(price)
        .bind(amount)
        .bind(balance_after)
        .bind(now)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::InternalError("Failed to create transaction".to_string()))
    }

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> AppResult<Option<Transaction>> {
        let tx = sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await?;
        Ok(tx)
    }

    pub async fn find_by_user(
        pool: &SqlitePool,
        user_id: &str,
        limit: i32,
        offset: i32,
    ) -> AppResult<Vec<Transaction>> {
        let txs = sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;
        Ok(txs)
    }
}

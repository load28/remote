use sqlx::SqlitePool;

use crate::db::models::*;
use crate::db::repository::*;
use crate::error::{AppError, AppResult};

pub struct PortfolioService {
    pool: SqlitePool,
}

impl PortfolioService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Get portfolio summary for a user
    pub async fn get_portfolio(&self, user_id: &str) -> AppResult<PortfolioSummary> {
        // Get account
        let account = AccountRepository::find_by_user_id(&self.pool, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Account not found".to_string()))?;

        // Get holdings
        let holdings = HoldingRepository::find_by_user(&self.pool, user_id).await?;

        // Calculate portfolio details
        let mut holding_details = Vec::new();
        let mut total_stock_value = 0.0;
        let mut total_invested = 0.0;

        for holding in holdings {
            let stock = StockRepository::find_by_id(&self.pool, &holding.stock_id)
                .await?
                .ok_or_else(|| AppError::NotFound("Stock not found".to_string()))?;

            let current_value = stock.current_price * holding.quantity as f64;
            let profit_loss = current_value - holding.total_invested;
            let profit_loss_rate = if holding.total_invested > 0.0 {
                (profit_loss / holding.total_invested) * 100.0
            } else {
                0.0
            };

            total_stock_value += current_value;
            total_invested += holding.total_invested;

            holding_details.push(HoldingDetail {
                stock_id: holding.stock_id,
                symbol: stock.symbol,
                name: stock.name,
                quantity: holding.quantity,
                average_price: holding.average_price,
                current_price: stock.current_price,
                total_invested: holding.total_invested,
                current_value,
                profit_loss,
                profit_loss_rate,
            });
        }

        let total_asset = account.balance + total_stock_value;
        let total_profit_loss = total_stock_value - total_invested;
        let profit_loss_rate = if total_invested > 0.0 {
            (total_profit_loss / total_invested) * 100.0
        } else {
            0.0
        };

        Ok(PortfolioSummary {
            total_asset,
            cash_balance: account.balance,
            stock_value: total_stock_value,
            total_profit_loss,
            profit_loss_rate,
            holdings: holding_details,
        })
    }

    /// Get account details
    pub async fn get_account(&self, user_id: &str) -> AppResult<Account> {
        AccountRepository::find_by_user_id(&self.pool, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Account not found".to_string()))
    }

    /// Deposit funds
    pub async fn deposit(&self, user_id: &str, amount: f64) -> AppResult<Account> {
        if amount <= 0.0 {
            return Err(AppError::ValidationError("Amount must be positive".to_string()));
        }

        let account = AccountRepository::deposit(&self.pool, user_id, amount).await?;

        // Record transaction
        TransactionRepository::create(
            &self.pool,
            user_id,
            None,
            None,
            TransactionType::Deposit,
            None,
            None,
            amount,
            account.balance,
        )
        .await?;

        Ok(account)
    }

    /// Withdraw funds
    pub async fn withdraw(&self, user_id: &str, amount: f64) -> AppResult<Account> {
        if amount <= 0.0 {
            return Err(AppError::ValidationError("Amount must be positive".to_string()));
        }

        let account = AccountRepository::withdraw(&self.pool, user_id, amount).await?;

        // Record transaction
        TransactionRepository::create(
            &self.pool,
            user_id,
            None,
            None,
            TransactionType::Withdraw,
            None,
            None,
            -amount,
            account.balance,
        )
        .await?;

        Ok(account)
    }

    /// Get transaction history
    pub async fn get_transactions(
        &self,
        user_id: &str,
        limit: i32,
        offset: i32,
    ) -> AppResult<Vec<Transaction>> {
        TransactionRepository::find_by_user(&self.pool, user_id, limit, offset).await
    }

    /// Get holdings
    pub async fn get_holdings(&self, user_id: &str) -> AppResult<Vec<Holding>> {
        HoldingRepository::find_by_user(&self.pool, user_id).await
    }
}

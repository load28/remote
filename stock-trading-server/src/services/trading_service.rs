use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::db::models::*;
use crate::db::repository::*;
use crate::error::{AppError, AppResult};

pub struct TradingService {
    pool: SqlitePool,
}

impl TradingService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Place a new order (buy or sell)
    pub async fn place_order(
        &self,
        user_id: &str,
        stock_id: &str,
        order_type: OrderType,
        order_side: OrderSide,
        quantity: i64,
        limit_price: Option<f64>,
    ) -> AppResult<Order> {
        // Validate quantity
        if quantity <= 0 {
            return Err(AppError::InvalidOrder("Quantity must be positive".to_string()));
        }

        // Get stock
        let stock = StockRepository::find_by_id(&self.pool, stock_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Stock not found".to_string()))?;

        if !stock.is_active {
            return Err(AppError::InvalidOrder("Stock is not tradeable".to_string()));
        }

        // Get account
        let account = AccountRepository::find_by_user_id(&self.pool, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Account not found".to_string()))?;

        // Determine execution price
        let execution_price = match order_type {
            OrderType::Market => stock.current_price,
            OrderType::Limit => limit_price.ok_or_else(|| {
                AppError::InvalidOrder("Limit price required for limit orders".to_string())
            })?,
        };

        // Validate funds/shares
        match order_side {
            OrderSide::Buy => {
                let total_cost = execution_price * quantity as f64;
                if account.balance < total_cost {
                    return Err(AppError::InsufficientFunds(format!(
                        "Required: {:.2}, Available: {:.2}",
                        total_cost, account.balance
                    )));
                }
            }
            OrderSide::Sell => {
                let holding = HoldingRepository::find_by_user_and_stock(&self.pool, user_id, stock_id)
                    .await?;
                let owned_quantity = holding.map(|h| h.quantity).unwrap_or(0);
                if owned_quantity < quantity {
                    return Err(AppError::InsufficientShares(format!(
                        "Required: {}, Available: {}",
                        quantity, owned_quantity
                    )));
                }
            }
        }

        // Create order
        let order = OrderRepository::create(
            &self.pool,
            user_id,
            stock_id,
            order_type,
            order_side,
            quantity,
            limit_price,
        )
        .await?;

        // For market orders, execute immediately
        if order_type == OrderType::Market {
            self.execute_market_order(&order, &stock).await?;
        } else {
            // For limit orders, try to match with existing orders
            self.try_match_limit_order(&order, &stock).await?;
        }

        // Return updated order
        OrderRepository::find_by_id(&self.pool, &order.id)
            .await?
            .ok_or_else(|| AppError::InternalError("Order not found after creation".to_string()))
    }

    /// Execute a market order immediately
    async fn execute_market_order(&self, order: &Order, stock: &Stock) -> AppResult<()> {
        let order_side = OrderSide::from_str(&order.order_side)
            .ok_or_else(|| AppError::InternalError("Invalid order side".to_string()))?;

        // Execute at current market price
        let execution_price = stock.current_price;
        let quantity = order.quantity;
        let total_amount = execution_price * quantity as f64;

        // Update account balance
        let account = AccountRepository::find_by_user_id(&self.pool, &order.user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Account not found".to_string()))?;

        let new_balance = match order_side {
            OrderSide::Buy => account.balance - total_amount,
            OrderSide::Sell => account.balance + total_amount,
        };

        AccountRepository::update_balance(&self.pool, &order.user_id, new_balance).await?;

        // Update holdings
        let quantity_delta = match order_side {
            OrderSide::Buy => quantity,
            OrderSide::Sell => -quantity,
        };

        HoldingRepository::upsert(&self.pool, &order.user_id, &order.stock_id, quantity_delta, execution_price)
            .await?;

        // Update order status
        OrderRepository::update_order_fill(
            &self.pool,
            &order.id,
            quantity,
            execution_price,
            OrderStatus::Filled,
        )
        .await?;

        // Record transaction
        let transaction_type = match order_side {
            OrderSide::Buy => TransactionType::Buy,
            OrderSide::Sell => TransactionType::Sell,
        };

        TransactionRepository::create(
            &self.pool,
            &order.user_id,
            Some(&order.stock_id),
            Some(&order.id),
            transaction_type,
            Some(quantity),
            Some(execution_price),
            total_amount,
            new_balance,
        )
        .await?;

        // Update stock volume
        StockRepository::update_price(&self.pool, &order.stock_id, execution_price, quantity).await?;

        Ok(())
    }

    /// Try to match a limit order with existing orders
    async fn try_match_limit_order(&self, order: &Order, stock: &Stock) -> AppResult<()> {
        let order_side = OrderSide::from_str(&order.order_side)
            .ok_or_else(|| AppError::InternalError("Invalid order side".to_string()))?;

        let limit_price = order.price.ok_or_else(|| {
            AppError::InternalError("Limit order must have a price".to_string())
        })?;

        // For simplicity in mock trading, we'll execute limit orders if the price is favorable
        let should_execute = match order_side {
            OrderSide::Buy => limit_price >= stock.current_price,  // Buy if limit >= market
            OrderSide::Sell => limit_price <= stock.current_price, // Sell if limit <= market
        };

        if should_execute {
            // Execute at the limit price (better for the user)
            let execution_price = match order_side {
                OrderSide::Buy => stock.current_price.min(limit_price),
                OrderSide::Sell => stock.current_price.max(limit_price),
            };

            let quantity = order.quantity;
            let total_amount = execution_price * quantity as f64;

            // Update account balance
            let account = AccountRepository::find_by_user_id(&self.pool, &order.user_id)
                .await?
                .ok_or_else(|| AppError::NotFound("Account not found".to_string()))?;

            let new_balance = match order_side {
                OrderSide::Buy => account.balance - total_amount,
                OrderSide::Sell => account.balance + total_amount,
            };

            AccountRepository::update_balance(&self.pool, &order.user_id, new_balance).await?;

            // Update holdings
            let quantity_delta = match order_side {
                OrderSide::Buy => quantity,
                OrderSide::Sell => -quantity,
            };

            HoldingRepository::upsert(&self.pool, &order.user_id, &order.stock_id, quantity_delta, execution_price)
                .await?;

            // Update order status
            OrderRepository::update_order_fill(
                &self.pool,
                &order.id,
                quantity,
                execution_price,
                OrderStatus::Filled,
            )
            .await?;

            // Record transaction
            let transaction_type = match order_side {
                OrderSide::Buy => TransactionType::Buy,
                OrderSide::Sell => TransactionType::Sell,
            };

            TransactionRepository::create(
                &self.pool,
                &order.user_id,
                Some(&order.stock_id),
                Some(&order.id),
                transaction_type,
                Some(quantity),
                Some(execution_price),
                total_amount,
                new_balance,
            )
            .await?;

            // Update stock price (slight movement on trades)
            let price_impact = match order_side {
                OrderSide::Buy => 0.001,  // Buy pushes price up slightly
                OrderSide::Sell => -0.001, // Sell pushes price down slightly
            };
            let new_price = stock.current_price * (1.0 + price_impact);
            StockRepository::update_price(&self.pool, &order.stock_id, new_price, quantity).await?;
        }

        Ok(())
    }

    /// Cancel an existing order
    pub async fn cancel_order(&self, user_id: &str, order_id: &str) -> AppResult<Order> {
        let order = OrderRepository::find_by_id(&self.pool, order_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

        // Verify ownership
        if order.user_id != user_id {
            return Err(AppError::AuthError("Not authorized to cancel this order".to_string()));
        }

        // Check if order can be cancelled
        let status = OrderStatus::from_str(&order.status)
            .ok_or_else(|| AppError::InternalError("Invalid order status".to_string()))?;

        match status {
            OrderStatus::Pending | OrderStatus::Partial => {
                OrderRepository::cancel_order(&self.pool, order_id).await?;
            }
            _ => {
                return Err(AppError::InvalidOrder(format!(
                    "Cannot cancel order with status: {}",
                    order.status
                )));
            }
        }

        OrderRepository::find_by_id(&self.pool, order_id)
            .await?
            .ok_or_else(|| AppError::InternalError("Order not found after cancel".to_string()))
    }

    /// Get user's orders
    pub async fn get_orders(
        &self,
        user_id: &str,
        status: Option<&str>,
        limit: i32,
    ) -> AppResult<Vec<Order>> {
        OrderRepository::find_by_user(&self.pool, user_id, status, limit).await
    }

    /// Get order book for a stock
    pub async fn get_order_book(&self, stock_id: &str) -> AppResult<OrderBook> {
        let stock = StockRepository::find_by_id(&self.pool, stock_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Stock not found".to_string()))?;

        // Get pending buy orders (bids)
        let buy_orders = OrderRepository::find_pending_orders(&self.pool, stock_id, OrderSide::Buy).await?;

        // Get pending sell orders (asks)
        let sell_orders = OrderRepository::find_pending_orders(&self.pool, stock_id, OrderSide::Sell).await?;

        // Aggregate by price level
        let bids = aggregate_orders(&buy_orders);
        let asks = aggregate_orders(&sell_orders);

        Ok(OrderBook {
            stock_id: stock_id.to_string(),
            symbol: stock.symbol,
            asks,
            bids,
            last_price: stock.current_price,
            timestamp: chrono::Utc::now(),
        })
    }
}

fn aggregate_orders(orders: &[Order]) -> Vec<OrderBookEntry> {
    use std::collections::BTreeMap;

    let mut aggregated: BTreeMap<i64, (i64, i32)> = BTreeMap::new();

    for order in orders {
        if let Some(price) = order.price {
            // Convert to cents for grouping
            let price_cents = (price * 100.0) as i64;
            let remaining = order.quantity - order.filled_quantity;
            let entry = aggregated.entry(price_cents).or_insert((0, 0));
            entry.0 += remaining;
            entry.1 += 1;
        }
    }

    aggregated
        .into_iter()
        .map(|(price_cents, (quantity, count))| OrderBookEntry {
            price: price_cents as f64 / 100.0,
            quantity,
            order_count: count,
        })
        .collect()
}

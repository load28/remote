use chrono::Utc;
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::broadcast;

use crate::db::models::*;
use crate::db::repository::*;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PriceUpdate {
    pub stock_id: String,
    pub symbol: String,
    pub price: f64,
    pub change: f64,
    pub change_percent: f64,
    pub volume: i64,
    pub timestamp: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct MarketSummary {
    pub total_stocks: i64,
    pub market_status: String,
    pub top_gainers: Vec<StockChange>,
    pub top_losers: Vec<StockChange>,
    pub most_active: Vec<StockChange>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct StockChange {
    pub symbol: String,
    pub name: String,
    pub price: f64,
    pub change: f64,
    pub change_percent: f64,
    pub volume: i64,
}

pub struct MarketService {
    pool: SqlitePool,
    price_sender: broadcast::Sender<PriceUpdate>,
}

impl MarketService {
    pub fn new(pool: SqlitePool) -> Self {
        let (tx, _) = broadcast::channel(1000);
        Self {
            pool,
            price_sender: tx,
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<PriceUpdate> {
        self.price_sender.subscribe()
    }

    /// Get all stocks
    pub async fn get_stocks(&self) -> AppResult<Vec<Stock>> {
        StockRepository::find_all(&self.pool).await
    }

    /// Get stock by ID
    pub async fn get_stock(&self, stock_id: &str) -> AppResult<Stock> {
        StockRepository::find_by_id(&self.pool, stock_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Stock not found".to_string()))
    }

    /// Get stock by symbol
    pub async fn get_stock_by_symbol(&self, symbol: &str) -> AppResult<Stock> {
        StockRepository::find_by_symbol(&self.pool, symbol)
            .await?
            .ok_or_else(|| AppError::NotFound("Stock not found".to_string()))
    }

    /// Get stocks by market
    pub async fn get_stocks_by_market(&self, market: &str) -> AppResult<Vec<Stock>> {
        StockRepository::find_by_market(&self.pool, market).await
    }

    /// Search stocks
    pub async fn search_stocks(&self, query: &str) -> AppResult<Vec<Stock>> {
        StockRepository::search(&self.pool, query).await
    }

    /// Get price history for a stock
    pub async fn get_price_history(
        &self,
        stock_id: &str,
        limit: i32,
    ) -> AppResult<Vec<PriceHistory>> {
        StockRepository::get_price_history(&self.pool, stock_id, limit).await
    }

    /// Get market summary
    pub async fn get_market_summary(&self) -> AppResult<MarketSummary> {
        let stocks = self.get_stocks().await?;

        let mut stock_changes: Vec<StockChange> = stocks
            .iter()
            .map(|s| {
                let change = s.current_price - s.previous_close;
                let change_percent = if s.previous_close > 0.0 {
                    (change / s.previous_close) * 100.0
                } else {
                    0.0
                };
                StockChange {
                    symbol: s.symbol.clone(),
                    name: s.name.clone(),
                    price: s.current_price,
                    change,
                    change_percent,
                    volume: s.volume,
                }
            })
            .collect();

        // Top gainers (highest positive change)
        let mut gainers = stock_changes.clone();
        gainers.sort_by(|a, b| b.change_percent.partial_cmp(&a.change_percent).unwrap());
        let top_gainers: Vec<_> = gainers.into_iter().filter(|s| s.change_percent > 0.0).take(5).collect();

        // Top losers (most negative change)
        let mut losers = stock_changes.clone();
        losers.sort_by(|a, b| a.change_percent.partial_cmp(&b.change_percent).unwrap());
        let top_losers: Vec<_> = losers.into_iter().filter(|s| s.change_percent < 0.0).take(5).collect();

        // Most active (highest volume)
        stock_changes.sort_by(|a, b| b.volume.cmp(&a.volume));
        let most_active: Vec<_> = stock_changes.into_iter().take(5).collect();

        Ok(MarketSummary {
            total_stocks: stocks.len() as i64,
            market_status: self.get_market_status(),
            top_gainers,
            top_losers,
            most_active,
        })
    }

    fn get_market_status(&self) -> String {
        // In a real system, this would check actual market hours
        // For mock trading, we always return "open"
        "open".to_string()
    }

    /// Simulate price movements (for mock trading)
    pub async fn simulate_price_movement(&self) -> AppResult<()> {
        let stocks = self.get_stocks().await?;
        let mut rng = StdRng::from_entropy();

        for stock in stocks {
            // Random price movement (-2% to +2%)
            let change_percent = rng.gen_range(-0.02..0.02);
            let new_price = stock.current_price * (1.0 + change_percent);

            // Ensure price doesn't go below minimum
            let new_price = new_price.max(0.01);

            // Update stock price
            StockRepository::update_price(&self.pool, &stock.id, new_price, 0).await?;

            // Calculate change
            let change = new_price - stock.previous_close;
            let change_pct = if stock.previous_close > 0.0 {
                (change / stock.previous_close) * 100.0
            } else {
                0.0
            };

            // Broadcast price update
            let update = PriceUpdate {
                stock_id: stock.id.clone(),
                symbol: stock.symbol.clone(),
                price: new_price,
                change,
                change_percent: change_pct,
                volume: stock.volume,
                timestamp: Utc::now(),
            };

            let _ = self.price_sender.send(update);
        }

        Ok(())
    }

    /// Start price simulation loop
    pub fn start_price_simulation(self: Arc<Self>) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));

            loop {
                interval.tick().await;
                if let Err(e) = self.simulate_price_movement().await {
                    tracing::error!("Price simulation error: {:?}", e);
                }
            }
        });
    }

    /// Record end-of-day price
    pub async fn record_daily_price(&self, stock_id: &str) -> AppResult<()> {
        let stock = self.get_stock(stock_id).await?;

        StockRepository::add_price_history(
            &self.pool,
            stock_id,
            stock.open_price,
            stock.high_price,
            stock.low_price,
            stock.current_price,
            stock.volume,
            Utc::now(),
        )
        .await
    }
}

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use uuid::Uuid;

/// Order side (buy or sell)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    Buy,
    Sell,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    Open,
    PartiallyFilled,
    Filled,
    Cancelled,
}

/// Represents a trading order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub user_address: String,
    pub pair: TradingPair,
    pub side: OrderSide,
    pub price: f64,
    pub quantity: f64,
    pub filled_quantity: f64,
    pub status: OrderStatus,
    pub timestamp: i64,
}

impl Order {
    /// Creates a new order
    pub fn new(
        user_address: String,
        pair: TradingPair,
        side: OrderSide,
        price: f64,
        quantity: f64,
    ) -> Self {
        Order {
            id: Uuid::new_v4().to_string(),
            user_address,
            pair,
            side,
            price,
            quantity,
            filled_quantity: 0.0,
            status: OrderStatus::Open,
            timestamp: Utc::now().timestamp(),
        }
    }

    /// Returns the remaining quantity to be filled
    pub fn remaining_quantity(&self) -> f64 {
        self.quantity - self.filled_quantity
    }

    /// Fills the order with the given quantity
    pub fn fill(&mut self, quantity: f64) {
        self.filled_quantity += quantity;
        if self.filled_quantity >= self.quantity {
            self.status = OrderStatus::Filled;
        } else {
            self.status = OrderStatus::PartiallyFilled;
        }
    }

    /// Cancels the order
    pub fn cancel(&mut self) {
        self.status = OrderStatus::Cancelled;
    }
}

/// Trading pair (e.g., BTC/USDT)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TradingPair {
    pub base: String,  // e.g., BTC
    pub quote: String, // e.g., USDT
}

impl TradingPair {
    pub fn new(base: &str, quote: &str) -> Self {
        TradingPair {
            base: base.to_string(),
            quote: quote.to_string(),
        }
    }

    pub fn symbol(&self) -> String {
        format!("{}/{}", self.base, self.quote)
    }
}

/// Order book for a trading pair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBook {
    pub pair: TradingPair,
    pub buy_orders: Vec<Order>,  // Sorted by price descending (highest first)
    pub sell_orders: Vec<Order>, // Sorted by price ascending (lowest first)
}

impl OrderBook {
    pub fn new(pair: TradingPair) -> Self {
        OrderBook {
            pair,
            buy_orders: vec![],
            sell_orders: vec![],
        }
    }

    /// Adds a buy order to the order book
    pub fn add_buy_order(&mut self, order: Order) {
        self.buy_orders.push(order);
        // Sort by price descending, then by timestamp ascending
        self.buy_orders.sort_by(|a, b| {
            match b.price.partial_cmp(&a.price) {
                Some(Ordering::Equal) => a.timestamp.cmp(&b.timestamp),
                Some(ord) => ord,
                None => Ordering::Equal,
            }
        });
    }

    /// Adds a sell order to the order book
    pub fn add_sell_order(&mut self, order: Order) {
        self.sell_orders.push(order);
        // Sort by price ascending, then by timestamp ascending
        self.sell_orders.sort_by(|a, b| {
            match a.price.partial_cmp(&b.price) {
                Some(Ordering::Equal) => a.timestamp.cmp(&b.timestamp),
                Some(ord) => ord,
                None => Ordering::Equal,
            }
        });
    }

    /// Gets the best bid (highest buy price)
    pub fn best_bid(&self) -> Option<f64> {
        self.buy_orders
            .iter()
            .filter(|o| o.status == OrderStatus::Open || o.status == OrderStatus::PartiallyFilled)
            .map(|o| o.price)
            .next()
    }

    /// Gets the best ask (lowest sell price)
    pub fn best_ask(&self) -> Option<f64> {
        self.sell_orders
            .iter()
            .filter(|o| o.status == OrderStatus::Open || o.status == OrderStatus::PartiallyFilled)
            .map(|o| o.price)
            .next()
    }

    /// Gets the spread between best bid and ask
    pub fn spread(&self) -> Option<f64> {
        match (self.best_bid(), self.best_ask()) {
            (Some(bid), Some(ask)) => Some(ask - bid),
            _ => None,
        }
    }

    /// Removes filled and cancelled orders
    pub fn clean_orders(&mut self) {
        self.buy_orders.retain(|o| {
            o.status == OrderStatus::Open || o.status == OrderStatus::PartiallyFilled
        });
        self.sell_orders.retain(|o| {
            o.status == OrderStatus::Open || o.status == OrderStatus::PartiallyFilled
        });
    }

    /// Gets an order by ID
    pub fn get_order_mut(&mut self, order_id: &str) -> Option<&mut Order> {
        self.buy_orders
            .iter_mut()
            .chain(self.sell_orders.iter_mut())
            .find(|o| o.id == order_id)
    }
}

/// Represents a trade execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    pub id: String,
    pub pair: TradingPair,
    pub price: f64,
    pub quantity: f64,
    pub buyer_address: String,
    pub seller_address: String,
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub timestamp: i64,
}

impl Trade {
    pub fn new(
        pair: TradingPair,
        price: f64,
        quantity: f64,
        buyer_address: String,
        seller_address: String,
        buy_order_id: String,
        sell_order_id: String,
    ) -> Self {
        Trade {
            id: Uuid::new_v4().to_string(),
            pair,
            price,
            quantity,
            buyer_address,
            seller_address,
            buy_order_id,
            sell_order_id,
            timestamp: Utc::now().timestamp(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_order_creation() {
        let pair = TradingPair::new("BTC", "USDT");
        let order = Order::new(
            "user123".to_string(),
            pair,
            OrderSide::Buy,
            50000.0,
            1.0,
        );
        assert_eq!(order.status, OrderStatus::Open);
        assert_eq!(order.remaining_quantity(), 1.0);
    }

    #[test]
    fn test_order_fill() {
        let pair = TradingPair::new("BTC", "USDT");
        let mut order = Order::new(
            "user123".to_string(),
            pair,
            OrderSide::Buy,
            50000.0,
            2.0,
        );

        order.fill(1.0);
        assert_eq!(order.status, OrderStatus::PartiallyFilled);
        assert_eq!(order.remaining_quantity(), 1.0);

        order.fill(1.0);
        assert_eq!(order.status, OrderStatus::Filled);
    }

    #[test]
    fn test_order_book() {
        let pair = TradingPair::new("ETH", "USDT");
        let mut order_book = OrderBook::new(pair.clone());

        let buy1 = Order::new("buyer1".to_string(), pair.clone(), OrderSide::Buy, 2000.0, 1.0);
        let buy2 = Order::new("buyer2".to_string(), pair.clone(), OrderSide::Buy, 2100.0, 1.0);
        let sell1 = Order::new("seller1".to_string(), pair.clone(), OrderSide::Sell, 2200.0, 1.0);
        let sell2 = Order::new("seller2".to_string(), pair.clone(), OrderSide::Sell, 2150.0, 1.0);

        order_book.add_buy_order(buy1);
        order_book.add_buy_order(buy2);
        order_book.add_sell_order(sell1);
        order_book.add_sell_order(sell2);

        assert_eq!(order_book.best_bid(), Some(2100.0));
        assert_eq!(order_book.best_ask(), Some(2150.0));
        assert_eq!(order_book.spread(), Some(50.0));
    }
}

use std::collections::HashMap;

use crate::block::Blockchain;
use crate::order::{Order, OrderBook, OrderSide, OrderStatus, Trade, TradingPair};
use crate::transaction::Transaction;
use crate::wallet::WalletManager;

/// The main exchange struct that handles trading operations
#[derive(Debug)]
pub struct Exchange {
    pub name: String,
    pub order_books: HashMap<String, OrderBook>,
    pub wallet_manager: WalletManager,
    pub blockchain: Blockchain,
    pub trades: Vec<Trade>,
    pub supported_pairs: Vec<TradingPair>,
}

impl Exchange {
    /// Creates a new exchange
    pub fn new(name: &str) -> Self {
        let mut exchange = Exchange {
            name: name.to_string(),
            order_books: HashMap::new(),
            wallet_manager: WalletManager::new(),
            blockchain: Blockchain::new(2, 10.0), // difficulty: 2, reward: 10
            trades: vec![],
            supported_pairs: vec![],
        };

        // Add default trading pairs
        let default_pairs = vec![
            TradingPair::new("BTC", "USDT"),
            TradingPair::new("ETH", "USDT"),
            TradingPair::new("ETH", "BTC"),
        ];

        for pair in default_pairs {
            exchange.add_trading_pair(pair);
        }

        exchange
    }

    /// Adds a new trading pair to the exchange
    pub fn add_trading_pair(&mut self, pair: TradingPair) {
        let symbol = pair.symbol();
        if !self.order_books.contains_key(&symbol) {
            self.order_books.insert(symbol, OrderBook::new(pair.clone()));
            self.supported_pairs.push(pair);
        }
    }

    /// Creates a new user wallet
    pub fn create_wallet(&mut self, owner: &str) -> String {
        self.wallet_manager.create_wallet(owner)
    }

    /// Deposits funds to a user's wallet
    pub fn deposit(&mut self, address: &str, currency: &str, amount: f64) -> Result<(), String> {
        self.wallet_manager.deposit(address, currency, amount)?;

        // Record the deposit transaction on the blockchain
        let tx = Transaction::new_deposit(address.to_string(), amount);
        let _ = self.blockchain.add_transaction(tx);

        Ok(())
    }

    /// Withdraws funds from a user's wallet
    pub fn withdraw(&mut self, address: &str, currency: &str, amount: f64) -> Result<(), String> {
        self.wallet_manager.withdraw(address, currency, amount)?;

        // Record the withdrawal transaction on the blockchain
        let tx = Transaction::new_withdrawal(address.to_string(), amount);
        let _ = self.blockchain.add_transaction(tx);

        Ok(())
    }

    /// Gets the balance of a user's wallet
    pub fn get_balance(&self, address: &str, currency: &str) -> f64 {
        self.wallet_manager
            .get_wallet(address)
            .map(|w| w.get_balance(currency))
            .unwrap_or(0.0)
    }

    /// Places a limit order
    pub fn place_order(
        &mut self,
        user_address: String,
        pair: TradingPair,
        side: OrderSide,
        price: f64,
        quantity: f64,
    ) -> Result<String, String> {
        // Validate the trading pair
        let symbol = pair.symbol();
        if !self.order_books.contains_key(&symbol) {
            return Err(format!("Trading pair {} not supported", symbol));
        }

        // Check user balance
        let required_currency = match side {
            OrderSide::Buy => &pair.quote,  // Need quote currency to buy
            OrderSide::Sell => &pair.base,  // Need base currency to sell
        };

        let required_amount = match side {
            OrderSide::Buy => price * quantity,
            OrderSide::Sell => quantity,
        };

        let balance = self.get_balance(&user_address, required_currency);
        if balance < required_amount {
            return Err(format!(
                "Insufficient {} balance. Required: {}, Available: {}",
                required_currency, required_amount, balance
            ));
        }

        // Lock the funds (withdraw from available balance)
        self.wallet_manager
            .withdraw(&user_address, required_currency, required_amount)?;

        // Create and add the order
        let order = Order::new(user_address, pair.clone(), side, price, quantity);
        let order_id = order.id.clone();

        // Try to match the order
        self.match_order(order)?;

        Ok(order_id)
    }

    /// Matches an incoming order against the order book
    fn match_order(&mut self, mut incoming: Order) -> Result<(), String> {
        let symbol = incoming.pair.symbol();

        // Get order book and perform matching
        let trades = {
            let order_book = self
                .order_books
                .get_mut(&symbol)
                .ok_or("Order book not found")?;

            match incoming.side {
                OrderSide::Buy => Self::match_buy_order(&mut incoming, order_book),
                OrderSide::Sell => Self::match_sell_order(&mut incoming, order_book),
            }
        };

        // Process trades
        for trade in trades {
            self.process_trade(&trade)?;
            self.trades.push(trade);
        }

        // If order is not fully filled, add to order book
        if incoming.status == OrderStatus::Open || incoming.status == OrderStatus::PartiallyFilled {
            let order_book = self.order_books.get_mut(&symbol).unwrap();
            match incoming.side {
                OrderSide::Buy => order_book.add_buy_order(incoming),
                OrderSide::Sell => order_book.add_sell_order(incoming),
            }
        }

        Ok(())
    }

    /// Matches a buy order against sell orders
    fn match_buy_order(buy_order: &mut Order, order_book: &mut OrderBook) -> Vec<Trade> {
        let mut trades = vec![];

        for sell_order in order_book.sell_orders.iter_mut() {
            if sell_order.status != OrderStatus::Open
                && sell_order.status != OrderStatus::PartiallyFilled
            {
                continue;
            }

            // Check if prices match (buy price >= sell price)
            if buy_order.price < sell_order.price {
                break; // No more matching orders (sorted by price)
            }

            // Calculate trade quantity
            let trade_quantity = buy_order
                .remaining_quantity()
                .min(sell_order.remaining_quantity());

            // Execute trade at sell order's price (price-time priority)
            let trade = Trade::new(
                buy_order.pair.clone(),
                sell_order.price,
                trade_quantity,
                buy_order.user_address.clone(),
                sell_order.user_address.clone(),
                buy_order.id.clone(),
                sell_order.id.clone(),
            );

            // Update orders
            buy_order.fill(trade_quantity);
            sell_order.fill(trade_quantity);

            trades.push(trade);

            if buy_order.status == OrderStatus::Filled {
                break;
            }
        }

        // Clean up filled orders
        order_book.clean_orders();

        trades
    }

    /// Matches a sell order against buy orders
    fn match_sell_order(
        sell_order: &mut Order,
        order_book: &mut OrderBook,
    ) -> Vec<Trade> {
        let mut trades = vec![];

        for buy_order in order_book.buy_orders.iter_mut() {
            if buy_order.status != OrderStatus::Open
                && buy_order.status != OrderStatus::PartiallyFilled
            {
                continue;
            }

            // Check if prices match (sell price <= buy price)
            if sell_order.price > buy_order.price {
                break; // No more matching orders (sorted by price)
            }

            // Calculate trade quantity
            let trade_quantity = sell_order
                .remaining_quantity()
                .min(buy_order.remaining_quantity());

            // Execute trade at buy order's price (price-time priority)
            let trade = Trade::new(
                sell_order.pair.clone(),
                buy_order.price,
                trade_quantity,
                buy_order.user_address.clone(),
                sell_order.user_address.clone(),
                buy_order.id.clone(),
                sell_order.id.clone(),
            );

            // Update orders
            sell_order.fill(trade_quantity);
            buy_order.fill(trade_quantity);

            trades.push(trade);

            if sell_order.status == OrderStatus::Filled {
                break;
            }
        }

        // Clean up filled orders
        order_book.clean_orders();

        trades
    }

    /// Processes a trade by updating wallets
    fn process_trade(&mut self, trade: &Trade) -> Result<(), String> {
        // Buyer receives base currency
        self.wallet_manager
            .deposit(&trade.buyer_address, &trade.pair.base, trade.quantity)?;

        // Seller receives quote currency
        let quote_amount = trade.price * trade.quantity;
        self.wallet_manager
            .deposit(&trade.seller_address, &trade.pair.quote, quote_amount)?;

        // Record the trade on the blockchain
        let tx = Transaction::new_trade(
            trade.seller_address.clone(),
            trade.buyer_address.clone(),
            trade.quantity,
        );
        let _ = self.blockchain.add_transaction(tx);

        println!(
            "Trade executed: {} {} @ {} {} (Buyer: {}, Seller: {})",
            trade.quantity,
            trade.pair.base,
            trade.price,
            trade.pair.quote,
            &trade.buyer_address[..8],
            &trade.seller_address[..8]
        );

        Ok(())
    }

    /// Cancels an order
    pub fn cancel_order(&mut self, order_id: &str, pair: &TradingPair) -> Result<(), String> {
        let symbol = pair.symbol();
        let order_book = self
            .order_books
            .get_mut(&symbol)
            .ok_or("Order book not found")?;

        let order = order_book
            .get_order_mut(order_id)
            .ok_or("Order not found")?;

        if order.status == OrderStatus::Filled || order.status == OrderStatus::Cancelled {
            return Err("Order cannot be cancelled".to_string());
        }

        // Refund remaining funds
        let refund_currency = match order.side {
            OrderSide::Buy => &pair.quote,
            OrderSide::Sell => &pair.base,
        };

        let refund_amount = match order.side {
            OrderSide::Buy => order.price * order.remaining_quantity(),
            OrderSide::Sell => order.remaining_quantity(),
        };

        self.wallet_manager
            .deposit(&order.user_address, refund_currency, refund_amount)?;

        order.cancel();
        order_book.clean_orders();

        Ok(())
    }

    /// Gets the order book for a trading pair
    pub fn get_order_book(&self, pair: &TradingPair) -> Option<&OrderBook> {
        self.order_books.get(&pair.symbol())
    }

    /// Gets recent trades
    pub fn get_recent_trades(&self, limit: usize) -> Vec<&Trade> {
        self.trades.iter().rev().take(limit).collect()
    }

    /// Mines pending transactions
    pub fn mine_transactions(&mut self, miner_address: &str) {
        self.blockchain.mine_pending_transactions(miner_address);
    }

    /// Prints the current state of the order book
    pub fn print_order_book(&self, pair: &TradingPair) {
        if let Some(order_book) = self.get_order_book(pair) {
            println!("\n=== Order Book: {} ===", pair.symbol());
            println!("--- SELL ORDERS ---");
            for order in order_book.sell_orders.iter().rev() {
                if order.status == OrderStatus::Open || order.status == OrderStatus::PartiallyFilled
                {
                    println!(
                        "  Price: {:.2}, Qty: {:.4}, Remaining: {:.4}",
                        order.price,
                        order.quantity,
                        order.remaining_quantity()
                    );
                }
            }
            println!("--- BUY ORDERS ---");
            for order in &order_book.buy_orders {
                if order.status == OrderStatus::Open || order.status == OrderStatus::PartiallyFilled
                {
                    println!(
                        "  Price: {:.2}, Qty: {:.4}, Remaining: {:.4}",
                        order.price,
                        order.quantity,
                        order.remaining_quantity()
                    );
                }
            }
            if let (Some(bid), Some(ask)) = (order_book.best_bid(), order_book.best_ask()) {
                println!("Spread: {:.2}", ask - bid);
            }
            println!("===================\n");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exchange_creation() {
        let exchange = Exchange::new("TestExchange");
        assert_eq!(exchange.name, "TestExchange");
        assert_eq!(exchange.supported_pairs.len(), 3);
    }

    #[test]
    fn test_order_matching() {
        let mut exchange = Exchange::new("TestExchange");

        // Create wallets
        let alice = exchange.create_wallet("Alice");
        let bob = exchange.create_wallet("Bob");

        // Deposit funds
        exchange.deposit(&alice, "USDT", 100000.0).unwrap();
        exchange.deposit(&bob, "BTC", 2.0).unwrap();

        let pair = TradingPair::new("BTC", "USDT");

        // Alice places a buy order
        exchange
            .place_order(alice.clone(), pair.clone(), OrderSide::Buy, 50000.0, 1.0)
            .unwrap();

        // Bob places a matching sell order
        exchange
            .place_order(bob.clone(), pair.clone(), OrderSide::Sell, 50000.0, 1.0)
            .unwrap();

        // Check balances after trade
        assert_eq!(exchange.get_balance(&alice, "BTC"), 1.0);
        assert_eq!(exchange.get_balance(&bob, "USDT"), 50000.0);
    }

    #[test]
    fn test_partial_fill() {
        let mut exchange = Exchange::new("TestExchange");

        let alice = exchange.create_wallet("Alice");
        let bob = exchange.create_wallet("Bob");

        exchange.deposit(&alice, "USDT", 100000.0).unwrap();
        exchange.deposit(&bob, "BTC", 1.0).unwrap();

        let pair = TradingPair::new("BTC", "USDT");

        // Alice wants to buy 2 BTC
        exchange
            .place_order(alice.clone(), pair.clone(), OrderSide::Buy, 50000.0, 2.0)
            .unwrap();

        // Bob only sells 1 BTC
        exchange
            .place_order(bob.clone(), pair.clone(), OrderSide::Sell, 50000.0, 1.0)
            .unwrap();

        // Check that only 1 BTC was traded
        assert_eq!(exchange.get_balance(&alice, "BTC"), 1.0);
        assert_eq!(exchange.get_balance(&bob, "USDT"), 50000.0);

        // Alice should have a remaining buy order for 1 BTC
        let order_book = exchange.get_order_book(&pair).unwrap();
        assert_eq!(order_book.buy_orders.len(), 1);
        assert_eq!(order_book.buy_orders[0].remaining_quantity(), 1.0);
    }
}

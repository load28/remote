mod block;
mod exchange;
mod order;
mod transaction;
mod wallet;

use std::io::{self, Write};

use exchange::Exchange;
use order::{OrderSide, TradingPair};

fn main() {
    println!("===========================================");
    println!("   Welcome to Rust Blockchain Exchange!");
    println!("===========================================\n");

    let mut exchange = Exchange::new("RustExchange");

    // Create demo wallets
    println!("Creating demo wallets...");
    let alice = exchange.create_wallet("Alice");
    let bob = exchange.create_wallet("Bob");
    let charlie = exchange.create_wallet("Charlie");

    println!("  Alice's address: {}...", &alice[..16]);
    println!("  Bob's address: {}...", &bob[..16]);
    println!("  Charlie's address: {}...", &charlie[..16]);

    // Deposit initial funds
    println!("\nDepositing initial funds...");
    exchange.deposit(&alice, "USDT", 100000.0).unwrap();
    exchange.deposit(&alice, "ETH", 10.0).unwrap();
    exchange.deposit(&bob, "BTC", 5.0).unwrap();
    exchange.deposit(&bob, "ETH", 20.0).unwrap();
    exchange.deposit(&charlie, "USDT", 50000.0).unwrap();
    exchange.deposit(&charlie, "BTC", 2.0).unwrap();

    print_balances(&exchange, &alice, &bob, &charlie);

    // Interactive demo
    loop {
        println!("\n=== Menu ===");
        println!("1. Place buy order");
        println!("2. Place sell order");
        println!("3. View order book");
        println!("4. View balances");
        println!("5. Run demo trades");
        println!("6. Mine pending transactions");
        println!("7. View blockchain info");
        println!("8. Exit");
        print!("\nSelect option: ");
        io::stdout().flush().unwrap();

        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        let choice = input.trim();

        match choice {
            "1" => place_order_interactive(&mut exchange, OrderSide::Buy, &alice, &bob, &charlie),
            "2" => place_order_interactive(&mut exchange, OrderSide::Sell, &alice, &bob, &charlie),
            "3" => view_order_book(&exchange),
            "4" => print_balances(&exchange, &alice, &bob, &charlie),
            "5" => run_demo_trades(&mut exchange, &alice, &bob, &charlie),
            "6" => {
                println!("\nMining pending transactions...");
                exchange.mine_transactions(&alice);
                println!("Mining complete!");
            }
            "7" => print_blockchain_info(&exchange),
            "8" => {
                println!("\nGoodbye!");
                break;
            }
            _ => println!("Invalid option, please try again."),
        }
    }
}

fn place_order_interactive(
    exchange: &mut Exchange,
    side: OrderSide,
    alice: &str,
    bob: &str,
    charlie: &str,
) {
    let side_str = match side {
        OrderSide::Buy => "BUY",
        OrderSide::Sell => "SELL",
    };

    println!("\n=== Place {} Order ===", side_str);
    println!("Select user:");
    println!("1. Alice");
    println!("2. Bob");
    println!("3. Charlie");
    print!("Choice: ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let user = match input.trim() {
        "1" => alice,
        "2" => bob,
        "3" => charlie,
        _ => {
            println!("Invalid user");
            return;
        }
    };

    println!("Select trading pair:");
    println!("1. BTC/USDT");
    println!("2. ETH/USDT");
    println!("3. ETH/BTC");
    print!("Choice: ");
    io::stdout().flush().unwrap();

    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let pair = match input.trim() {
        "1" => TradingPair::new("BTC", "USDT"),
        "2" => TradingPair::new("ETH", "USDT"),
        "3" => TradingPair::new("ETH", "BTC"),
        _ => {
            println!("Invalid pair");
            return;
        }
    };

    print!("Enter price: ");
    io::stdout().flush().unwrap();
    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let price: f64 = match input.trim().parse() {
        Ok(p) => p,
        Err(_) => {
            println!("Invalid price");
            return;
        }
    };

    print!("Enter quantity: ");
    io::stdout().flush().unwrap();
    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let quantity: f64 = match input.trim().parse() {
        Ok(q) => q,
        Err(_) => {
            println!("Invalid quantity");
            return;
        }
    };

    match exchange.place_order(user.to_string(), pair, side, price, quantity) {
        Ok(order_id) => println!("Order placed successfully! ID: {}...", &order_id[..8]),
        Err(e) => println!("Error placing order: {}", e),
    }
}

fn view_order_book(exchange: &Exchange) {
    println!("\nSelect trading pair:");
    println!("1. BTC/USDT");
    println!("2. ETH/USDT");
    println!("3. ETH/BTC");
    print!("Choice: ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let pair = match input.trim() {
        "1" => TradingPair::new("BTC", "USDT"),
        "2" => TradingPair::new("ETH", "USDT"),
        "3" => TradingPair::new("ETH", "BTC"),
        _ => {
            println!("Invalid pair");
            return;
        }
    };

    exchange.print_order_book(&pair);
}

fn print_balances(exchange: &Exchange, alice: &str, bob: &str, charlie: &str) {
    println!("\n=== Current Balances ===");
    println!(
        "Alice:   BTC: {:.4}, ETH: {:.4}, USDT: {:.2}",
        exchange.get_balance(alice, "BTC"),
        exchange.get_balance(alice, "ETH"),
        exchange.get_balance(alice, "USDT")
    );
    println!(
        "Bob:     BTC: {:.4}, ETH: {:.4}, USDT: {:.2}",
        exchange.get_balance(bob, "BTC"),
        exchange.get_balance(bob, "ETH"),
        exchange.get_balance(bob, "USDT")
    );
    println!(
        "Charlie: BTC: {:.4}, ETH: {:.4}, USDT: {:.2}",
        exchange.get_balance(charlie, "BTC"),
        exchange.get_balance(charlie, "ETH"),
        exchange.get_balance(charlie, "USDT")
    );
}

fn run_demo_trades(exchange: &mut Exchange, alice: &str, bob: &str, charlie: &str) {
    println!("\n=== Running Demo Trades ===\n");

    let btc_usdt = TradingPair::new("BTC", "USDT");
    let eth_usdt = TradingPair::new("ETH", "USDT");

    // Scenario 1: Direct match
    println!("Scenario 1: Alice buys 1 BTC from Bob at $50,000");
    println!("---");
    let _ = exchange.place_order(
        alice.to_string(),
        btc_usdt.clone(),
        OrderSide::Buy,
        50000.0,
        1.0,
    );
    let _ = exchange.place_order(
        bob.to_string(),
        btc_usdt.clone(),
        OrderSide::Sell,
        50000.0,
        1.0,
    );

    print_balances(exchange, alice, bob, charlie);

    // Scenario 2: Order book building
    println!("\nScenario 2: Building order book with multiple orders");
    println!("---");

    // Place several buy orders
    let _ = exchange.place_order(
        alice.to_string(),
        btc_usdt.clone(),
        OrderSide::Buy,
        49000.0,
        0.5,
    );
    let _ = exchange.place_order(
        charlie.to_string(),
        btc_usdt.clone(),
        OrderSide::Buy,
        48500.0,
        1.0,
    );

    // Place several sell orders
    let _ = exchange.place_order(
        bob.to_string(),
        btc_usdt.clone(),
        OrderSide::Sell,
        51000.0,
        0.5,
    );
    let _ = exchange.place_order(
        bob.to_string(),
        btc_usdt.clone(),
        OrderSide::Sell,
        52000.0,
        1.0,
    );

    exchange.print_order_book(&btc_usdt);

    // Scenario 3: ETH trading
    println!("Scenario 3: ETH/USDT trading");
    println!("---");
    let _ = exchange.place_order(
        charlie.to_string(),
        eth_usdt.clone(),
        OrderSide::Buy,
        3000.0,
        5.0,
    );
    let _ = exchange.place_order(
        bob.to_string(),
        eth_usdt.clone(),
        OrderSide::Sell,
        3000.0,
        3.0,
    );

    exchange.print_order_book(&eth_usdt);
    print_balances(exchange, alice, bob, charlie);

    println!("\nDemo trades completed!");
    println!("Recent trades:");
    for trade in exchange.get_recent_trades(5) {
        println!(
            "  {} {} @ {} {}",
            trade.quantity, trade.pair.base, trade.price, trade.pair.quote
        );
    }
}

fn print_blockchain_info(exchange: &Exchange) {
    println!("\n=== Blockchain Info ===");
    println!("Chain length: {} blocks", exchange.blockchain.chain.len());
    println!("Difficulty: {}", exchange.blockchain.difficulty);
    println!("Is valid: {}", exchange.blockchain.is_valid());
    println!(
        "Pending transactions: {}",
        exchange.blockchain.pending_transactions.len()
    );

    println!("\nRecent blocks:");
    for block in exchange.blockchain.chain.iter().rev().take(3) {
        println!(
            "  Block #{}: {} transactions, hash: {}...",
            block.index,
            block.transactions.len(),
            &block.hash[..16]
        );
    }
}

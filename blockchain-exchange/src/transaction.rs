use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents a transaction in the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: f64,
    pub timestamp: i64,
    pub transaction_type: TransactionType,
}

/// Types of transactions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransactionType {
    Transfer,     // Regular transfer between wallets
    Trade,        // Exchange trade transaction
    Deposit,      // Deposit to exchange
    Withdrawal,   // Withdrawal from exchange
    MiningReward, // Mining reward
}

impl Transaction {
    /// Creates a new transfer transaction
    pub fn new(from_address: String, to_address: String, amount: f64) -> Self {
        Transaction {
            id: Uuid::new_v4().to_string(),
            from_address,
            to_address,
            amount,
            timestamp: Utc::now().timestamp(),
            transaction_type: TransactionType::Transfer,
        }
    }

    /// Creates a trade transaction
    pub fn new_trade(from_address: String, to_address: String, amount: f64) -> Self {
        Transaction {
            id: Uuid::new_v4().to_string(),
            from_address,
            to_address,
            amount,
            timestamp: Utc::now().timestamp(),
            transaction_type: TransactionType::Trade,
        }
    }

    /// Creates a deposit transaction
    pub fn new_deposit(to_address: String, amount: f64) -> Self {
        Transaction {
            id: Uuid::new_v4().to_string(),
            from_address: "EXTERNAL".to_string(),
            to_address,
            amount,
            timestamp: Utc::now().timestamp(),
            transaction_type: TransactionType::Deposit,
        }
    }

    /// Creates a withdrawal transaction
    pub fn new_withdrawal(from_address: String, amount: f64) -> Self {
        Transaction {
            id: Uuid::new_v4().to_string(),
            from_address,
            to_address: "EXTERNAL".to_string(),
            amount,
            timestamp: Utc::now().timestamp(),
            transaction_type: TransactionType::Withdrawal,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_creation() {
        let tx = Transaction::new("Alice".to_string(), "Bob".to_string(), 100.0);
        assert_eq!(tx.from_address, "Alice");
        assert_eq!(tx.to_address, "Bob");
        assert_eq!(tx.amount, 100.0);
        assert_eq!(tx.transaction_type, TransactionType::Transfer);
    }

    #[test]
    fn test_trade_transaction() {
        let tx = Transaction::new_trade("Alice".to_string(), "Bob".to_string(), 50.0);
        assert_eq!(tx.transaction_type, TransactionType::Trade);
    }
}

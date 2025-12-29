use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::transaction::Transaction;

/// Represents a block in the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: i64,
    pub transactions: Vec<Transaction>,
    pub previous_hash: String,
    pub hash: String,
    pub nonce: u64,
}

impl Block {
    /// Creates a new block with the given transactions
    pub fn new(index: u64, transactions: Vec<Transaction>, previous_hash: String) -> Self {
        let timestamp = Utc::now().timestamp();
        let mut block = Block {
            index,
            timestamp,
            transactions,
            previous_hash,
            hash: String::new(),
            nonce: 0,
        };
        block.hash = block.calculate_hash();
        block
    }

    /// Calculates the hash of the block
    pub fn calculate_hash(&self) -> String {
        let data = format!(
            "{}{}{}{}{}",
            self.index,
            self.timestamp,
            serde_json::to_string(&self.transactions).unwrap_or_default(),
            self.previous_hash,
            self.nonce
        );
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Mines the block with the given difficulty (number of leading zeros)
    pub fn mine(&mut self, difficulty: usize) {
        let target = "0".repeat(difficulty);
        while &self.hash[..difficulty] != target {
            self.nonce += 1;
            self.hash = self.calculate_hash();
        }
        println!("Block mined: {}", self.hash);
    }
}

/// Represents the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockchain {
    pub chain: Vec<Block>,
    pub difficulty: usize,
    pub pending_transactions: Vec<Transaction>,
    pub mining_reward: f64,
}

impl Blockchain {
    /// Creates a new blockchain with a genesis block
    pub fn new(difficulty: usize, mining_reward: f64) -> Self {
        let genesis_block = Block::new(0, vec![], String::from("0"));
        Blockchain {
            chain: vec![genesis_block],
            difficulty,
            pending_transactions: vec![],
            mining_reward,
        }
    }

    /// Returns the latest block in the chain
    pub fn get_latest_block(&self) -> &Block {
        self.chain.last().expect("Blockchain should have at least one block")
    }

    /// Adds a transaction to the pending transactions
    pub fn add_transaction(&mut self, transaction: Transaction) -> Result<(), String> {
        if transaction.from_address.is_empty() || transaction.to_address.is_empty() {
            return Err("Transaction must include from and to address".to_string());
        }
        if transaction.amount <= 0.0 {
            return Err("Transaction amount must be positive".to_string());
        }
        self.pending_transactions.push(transaction);
        Ok(())
    }

    /// Mines pending transactions and rewards the miner
    pub fn mine_pending_transactions(&mut self, miner_address: &str) {
        // Create reward transaction for miner
        let reward_tx = Transaction::new(
            String::from("SYSTEM"),
            miner_address.to_string(),
            self.mining_reward,
        );
        self.pending_transactions.push(reward_tx);

        // Create new block with pending transactions
        let previous_hash = self.get_latest_block().hash.clone();
        let mut block = Block::new(
            self.chain.len() as u64,
            self.pending_transactions.clone(),
            previous_hash,
        );

        block.mine(self.difficulty);
        self.chain.push(block);
        self.pending_transactions = vec![];
    }

    /// Gets the balance of an address
    pub fn get_balance(&self, address: &str) -> f64 {
        let mut balance = 0.0;

        for block in &self.chain {
            for tx in &block.transactions {
                if tx.from_address == address {
                    balance -= tx.amount;
                }
                if tx.to_address == address {
                    balance += tx.amount;
                }
            }
        }

        balance
    }

    /// Validates the blockchain integrity
    pub fn is_valid(&self) -> bool {
        for i in 1..self.chain.len() {
            let current = &self.chain[i];
            let previous = &self.chain[i - 1];

            // Check if the hash is correct
            if current.hash != current.calculate_hash() {
                return false;
            }

            // Check if the previous hash reference is correct
            if current.previous_hash != previous.hash {
                return false;
            }
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blockchain_creation() {
        let blockchain = Blockchain::new(2, 100.0);
        assert_eq!(blockchain.chain.len(), 1);
        assert!(blockchain.is_valid());
    }

    #[test]
    fn test_mining() {
        let mut blockchain = Blockchain::new(1, 100.0);
        blockchain.add_transaction(Transaction::new(
            "Alice".to_string(),
            "Bob".to_string(),
            50.0,
        )).unwrap();
        blockchain.mine_pending_transactions("Miner");
        assert_eq!(blockchain.chain.len(), 2);
        assert!(blockchain.is_valid());
    }
}

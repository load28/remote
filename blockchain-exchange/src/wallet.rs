use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;

/// Represents a user's wallet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub address: String,
    pub owner: String,
    /// Balances for different cryptocurrencies
    pub balances: HashMap<String, f64>,
}

impl Wallet {
    /// Creates a new wallet for the given owner
    pub fn new(owner: &str) -> Self {
        // Generate a unique address based on owner and UUID
        let unique_data = format!("{}-{}", owner, Uuid::new_v4());
        let mut hasher = Sha256::new();
        hasher.update(unique_data.as_bytes());
        let address = format!("{:x}", hasher.finalize())[..40].to_string();

        let mut balances = HashMap::new();
        balances.insert("BTC".to_string(), 0.0);
        balances.insert("ETH".to_string(), 0.0);
        balances.insert("USDT".to_string(), 0.0);

        Wallet {
            address,
            owner: owner.to_string(),
            balances,
        }
    }

    /// Gets the balance for a specific cryptocurrency
    pub fn get_balance(&self, currency: &str) -> f64 {
        *self.balances.get(currency).unwrap_or(&0.0)
    }

    /// Deposits an amount of a specific cryptocurrency
    pub fn deposit(&mut self, currency: &str, amount: f64) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("Deposit amount must be positive".to_string());
        }
        let balance = self.balances.entry(currency.to_string()).or_insert(0.0);
        *balance += amount;
        Ok(())
    }

    /// Withdraws an amount of a specific cryptocurrency
    pub fn withdraw(&mut self, currency: &str, amount: f64) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("Withdrawal amount must be positive".to_string());
        }
        let balance = self.balances.entry(currency.to_string()).or_insert(0.0);
        if *balance < amount {
            return Err(format!("Insufficient {} balance", currency));
        }
        *balance -= amount;
        Ok(())
    }

    /// Transfers an amount to another wallet
    pub fn transfer(
        &mut self,
        to_wallet: &mut Wallet,
        currency: &str,
        amount: f64,
    ) -> Result<(), String> {
        self.withdraw(currency, amount)?;
        to_wallet.deposit(currency, amount)?;
        Ok(())
    }
}

/// Manages multiple wallets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletManager {
    wallets: HashMap<String, Wallet>,
}

impl WalletManager {
    pub fn new() -> Self {
        WalletManager {
            wallets: HashMap::new(),
        }
    }

    /// Creates a new wallet for the owner
    pub fn create_wallet(&mut self, owner: &str) -> String {
        let wallet = Wallet::new(owner);
        let address = wallet.address.clone();
        self.wallets.insert(address.clone(), wallet);
        address
    }

    /// Gets a reference to a wallet by address
    pub fn get_wallet(&self, address: &str) -> Option<&Wallet> {
        self.wallets.get(address)
    }

    /// Gets a mutable reference to a wallet by address
    pub fn get_wallet_mut(&mut self, address: &str) -> Option<&mut Wallet> {
        self.wallets.get_mut(address)
    }

    /// Deposits to a wallet
    pub fn deposit(&mut self, address: &str, currency: &str, amount: f64) -> Result<(), String> {
        let wallet = self
            .wallets
            .get_mut(address)
            .ok_or("Wallet not found")?;
        wallet.deposit(currency, amount)
    }

    /// Withdraws from a wallet
    pub fn withdraw(&mut self, address: &str, currency: &str, amount: f64) -> Result<(), String> {
        let wallet = self
            .wallets
            .get_mut(address)
            .ok_or("Wallet not found")?;
        wallet.withdraw(currency, amount)
    }
}

impl Default for WalletManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wallet_creation() {
        let wallet = Wallet::new("Alice");
        assert_eq!(wallet.owner, "Alice");
        assert_eq!(wallet.get_balance("BTC"), 0.0);
    }

    #[test]
    fn test_deposit_withdraw() {
        let mut wallet = Wallet::new("Bob");
        wallet.deposit("BTC", 10.0).unwrap();
        assert_eq!(wallet.get_balance("BTC"), 10.0);

        wallet.withdraw("BTC", 3.0).unwrap();
        assert_eq!(wallet.get_balance("BTC"), 7.0);
    }

    #[test]
    fn test_insufficient_balance() {
        let mut wallet = Wallet::new("Charlie");
        wallet.deposit("ETH", 5.0).unwrap();
        let result = wallet.withdraw("ETH", 10.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_transfer() {
        let mut alice = Wallet::new("Alice");
        let mut bob = Wallet::new("Bob");

        alice.deposit("USDT", 100.0).unwrap();
        alice.transfer(&mut bob, "USDT", 30.0).unwrap();

        assert_eq!(alice.get_balance("USDT"), 70.0);
        assert_eq!(bob.get_balance("USDT"), 30.0);
    }
}

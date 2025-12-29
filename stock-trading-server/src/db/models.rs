use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// User & Account Models
// ============================================================================

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct User {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Account {
    pub id: String,
    pub user_id: String,
    pub balance: f64,           // 현금 잔액
    pub total_deposit: f64,     // 총 입금액
    pub total_withdraw: f64,    // 총 출금액
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Stock Models
// ============================================================================

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Stock {
    pub id: String,
    pub symbol: String,         // 종목 코드 (예: AAPL, 005930)
    pub name: String,           // 종목명
    pub market: String,         // 시장 (KOSPI, KOSDAQ, NYSE, NASDAQ)
    pub sector: String,         // 섹터
    pub current_price: f64,     // 현재가
    pub previous_close: f64,    // 전일 종가
    pub open_price: f64,        // 시가
    pub high_price: f64,        // 고가
    pub low_price: f64,         // 저가
    pub volume: i64,            // 거래량
    pub market_cap: f64,        // 시가총액
    pub is_active: bool,        // 거래 가능 여부
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct PriceHistory {
    pub id: String,
    pub stock_id: String,
    pub open_price: f64,
    pub high_price: f64,
    pub low_price: f64,
    pub close_price: f64,
    pub volume: i64,
    pub recorded_at: DateTime<Utc>,
}

// ============================================================================
// Order Models
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OrderType {
    Market,  // 시장가
    Limit,   // 지정가
}

impl OrderType {
    pub fn as_str(&self) -> &'static str {
        match self {
            OrderType::Market => "market",
            OrderType::Limit => "limit",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "market" => Some(OrderType::Market),
            "limit" => Some(OrderType::Limit),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OrderSide {
    Buy,   // 매수
    Sell,  // 매도
}

impl OrderSide {
    pub fn as_str(&self) -> &'static str {
        match self {
            OrderSide::Buy => "buy",
            OrderSide::Sell => "sell",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "buy" => Some(OrderSide::Buy),
            "sell" => Some(OrderSide::Sell),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,    // 대기중
    Partial,    // 부분 체결
    Filled,     // 완전 체결
    Cancelled,  // 취소됨
    Rejected,   // 거부됨
    Expired,    // 만료됨
}

impl OrderStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            OrderStatus::Pending => "pending",
            OrderStatus::Partial => "partial",
            OrderStatus::Filled => "filled",
            OrderStatus::Cancelled => "cancelled",
            OrderStatus::Rejected => "rejected",
            OrderStatus::Expired => "expired",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "pending" => Some(OrderStatus::Pending),
            "partial" => Some(OrderStatus::Partial),
            "filled" => Some(OrderStatus::Filled),
            "cancelled" => Some(OrderStatus::Cancelled),
            "rejected" => Some(OrderStatus::Rejected),
            "expired" => Some(OrderStatus::Expired),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Order {
    pub id: String,
    pub user_id: String,
    pub stock_id: String,
    pub order_type: String,     // market, limit
    pub order_side: String,     // buy, sell
    pub quantity: i64,          // 주문 수량
    pub filled_quantity: i64,   // 체결된 수량
    pub price: Option<f64>,     // 지정가 (시장가일 경우 None)
    pub average_price: Option<f64>, // 평균 체결가
    pub status: String,         // pending, filled, cancelled, etc.
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

// ============================================================================
// Holding Models (보유 주식)
// ============================================================================

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Holding {
    pub id: String,
    pub user_id: String,
    pub stock_id: String,
    pub quantity: i64,           // 보유 수량
    pub average_price: f64,      // 평균 매수가
    pub total_invested: f64,     // 총 투자금액
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Transaction Models (거래 내역)
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransactionType {
    Buy,        // 매수
    Sell,       // 매도
    Deposit,    // 입금
    Withdraw,   // 출금
    Dividend,   // 배당
    Fee,        // 수수료
}

impl TransactionType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TransactionType::Buy => "buy",
            TransactionType::Sell => "sell",
            TransactionType::Deposit => "deposit",
            TransactionType::Withdraw => "withdraw",
            TransactionType::Dividend => "dividend",
            TransactionType::Fee => "fee",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "buy" => Some(TransactionType::Buy),
            "sell" => Some(TransactionType::Sell),
            "deposit" => Some(TransactionType::Deposit),
            "withdraw" => Some(TransactionType::Withdraw),
            "dividend" => Some(TransactionType::Dividend),
            "fee" => Some(TransactionType::Fee),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Transaction {
    pub id: String,
    pub user_id: String,
    pub stock_id: Option<String>,
    pub order_id: Option<String>,
    pub transaction_type: String,
    pub quantity: Option<i64>,
    pub price: Option<f64>,
    pub amount: f64,            // 거래 금액
    pub balance_after: f64,     // 거래 후 잔액
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// Order Book Entry (호가창)
// ============================================================================

#[derive(Debug, Clone, Serialize)]
pub struct OrderBookEntry {
    pub price: f64,
    pub quantity: i64,
    pub order_count: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct OrderBook {
    pub stock_id: String,
    pub symbol: String,
    pub asks: Vec<OrderBookEntry>,  // 매도 호가 (낮은 가격순)
    pub bids: Vec<OrderBookEntry>,  // 매수 호가 (높은 가격순)
    pub last_price: f64,
    pub timestamp: DateTime<Utc>,
}

// ============================================================================
// Portfolio Summary
// ============================================================================

#[derive(Debug, Clone, Serialize)]
pub struct PortfolioSummary {
    pub total_asset: f64,           // 총 자산
    pub cash_balance: f64,          // 현금 잔액
    pub stock_value: f64,           // 주식 평가금액
    pub total_profit_loss: f64,     // 총 손익
    pub profit_loss_rate: f64,      // 수익률 (%)
    pub holdings: Vec<HoldingDetail>,
}

#[derive(Debug, Clone, Serialize)]
pub struct HoldingDetail {
    pub stock_id: String,
    pub symbol: String,
    pub name: String,
    pub quantity: i64,
    pub average_price: f64,
    pub current_price: f64,
    pub total_invested: f64,
    pub current_value: f64,
    pub profit_loss: f64,
    pub profit_loss_rate: f64,
}

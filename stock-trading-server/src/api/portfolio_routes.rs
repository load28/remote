use axum::{
    extract::{Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::db::models::{Account, Holding, PortfolioSummary, Transaction};
use crate::error::AppResult;
use crate::middleware::CurrentUser;
use crate::services::PortfolioService;

pub struct PortfolioState {
    pub portfolio_service: Arc<PortfolioService>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionQuery {
    #[serde(default = "default_limit")]
    pub limit: i32,
    #[serde(default)]
    pub offset: i32,
}

fn default_limit() -> i32 {
    50
}

#[derive(Debug, Deserialize)]
pub struct AmountRequest {
    pub amount: f64,
}

#[derive(Debug, Serialize)]
pub struct AccountResponse {
    pub account: Account,
    pub message: String,
}

pub fn routes(state: Arc<PortfolioState>) -> Router {
    Router::new()
        .route("/portfolio", get(get_portfolio))
        .route("/account", get(get_account))
        .route("/account/deposit", post(deposit))
        .route("/account/withdraw", post(withdraw))
        .route("/holdings", get(get_holdings))
        .route("/transactions", get(get_transactions))
        .with_state(state)
}

async fn get_portfolio(
    State(state): State<Arc<PortfolioState>>,
    current_user: CurrentUser,
) -> AppResult<Json<PortfolioSummary>> {
    let portfolio = state
        .portfolio_service
        .get_portfolio(&current_user.0.user_id)
        .await?;
    Ok(Json(portfolio))
}

async fn get_account(
    State(state): State<Arc<PortfolioState>>,
    current_user: CurrentUser,
) -> AppResult<Json<Account>> {
    let account = state
        .portfolio_service
        .get_account(&current_user.0.user_id)
        .await?;
    Ok(Json(account))
}

async fn deposit(
    State(state): State<Arc<PortfolioState>>,
    current_user: CurrentUser,
    Json(req): Json<AmountRequest>,
) -> AppResult<Json<AccountResponse>> {
    let account = state
        .portfolio_service
        .deposit(&current_user.0.user_id, req.amount)
        .await?;

    Ok(Json(AccountResponse {
        account,
        message: format!("Successfully deposited {:.2}", req.amount),
    }))
}

async fn withdraw(
    State(state): State<Arc<PortfolioState>>,
    current_user: CurrentUser,
    Json(req): Json<AmountRequest>,
) -> AppResult<Json<AccountResponse>> {
    let account = state
        .portfolio_service
        .withdraw(&current_user.0.user_id, req.amount)
        .await?;

    Ok(Json(AccountResponse {
        account,
        message: format!("Successfully withdrew {:.2}", req.amount),
    }))
}

async fn get_holdings(
    State(state): State<Arc<PortfolioState>>,
    current_user: CurrentUser,
) -> AppResult<Json<Vec<Holding>>> {
    let holdings = state
        .portfolio_service
        .get_holdings(&current_user.0.user_id)
        .await?;
    Ok(Json(holdings))
}

async fn get_transactions(
    State(state): State<Arc<PortfolioState>>,
    current_user: CurrentUser,
    Query(query): Query<TransactionQuery>,
) -> AppResult<Json<Vec<Transaction>>> {
    let transactions = state
        .portfolio_service
        .get_transactions(&current_user.0.user_id, query.limit, query.offset)
        .await?;
    Ok(Json(transactions))
}

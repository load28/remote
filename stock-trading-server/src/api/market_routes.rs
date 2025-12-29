use axum::{
    extract::{Path, Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::db::models::{PriceHistory, Stock};
use crate::error::AppResult;
use crate::services::{market_service::MarketSummary, MarketService};

pub struct MarketState {
    pub market_service: Arc<MarketService>,
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

#[derive(Debug, Deserialize)]
pub struct HistoryQuery {
    #[serde(default = "default_limit")]
    pub limit: i32,
}

fn default_limit() -> i32 {
    100
}

pub fn routes(state: Arc<MarketState>) -> Router {
    Router::new()
        .route("/stocks", get(get_stocks))
        .route("/stocks/search", get(search_stocks))
        .route("/stocks/:id", get(get_stock))
        .route("/stocks/:id/history", get(get_stock_history))
        .route("/stocks/symbol/:symbol", get(get_stock_by_symbol))
        .route("/markets/:market", get(get_stocks_by_market))
        .route("/summary", get(get_market_summary))
        .with_state(state)
}

async fn get_stocks(State(state): State<Arc<MarketState>>) -> AppResult<Json<Vec<Stock>>> {
    let stocks = state.market_service.get_stocks().await?;
    Ok(Json(stocks))
}

async fn search_stocks(
    State(state): State<Arc<MarketState>>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<Stock>>> {
    let stocks = state.market_service.search_stocks(&query.q).await?;
    Ok(Json(stocks))
}

async fn get_stock(
    State(state): State<Arc<MarketState>>,
    Path(id): Path<String>,
) -> AppResult<Json<Stock>> {
    let stock = state.market_service.get_stock(&id).await?;
    Ok(Json(stock))
}

async fn get_stock_by_symbol(
    State(state): State<Arc<MarketState>>,
    Path(symbol): Path<String>,
) -> AppResult<Json<Stock>> {
    let stock = state.market_service.get_stock_by_symbol(&symbol).await?;
    Ok(Json(stock))
}

async fn get_stock_history(
    State(state): State<Arc<MarketState>>,
    Path(id): Path<String>,
    Query(query): Query<HistoryQuery>,
) -> AppResult<Json<Vec<PriceHistory>>> {
    let history = state.market_service.get_price_history(&id, query.limit).await?;
    Ok(Json(history))
}

async fn get_stocks_by_market(
    State(state): State<Arc<MarketState>>,
    Path(market): Path<String>,
) -> AppResult<Json<Vec<Stock>>> {
    let stocks = state.market_service.get_stocks_by_market(&market).await?;
    Ok(Json(stocks))
}

async fn get_market_summary(
    State(state): State<Arc<MarketState>>,
) -> AppResult<Json<MarketSummary>> {
    let summary = state.market_service.get_market_summary().await?;
    Ok(Json(summary))
}

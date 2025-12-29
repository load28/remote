use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::db::models::{Order, OrderBook, OrderSide, OrderType};
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::services::TradingService;

pub struct TradingState {
    pub trading_service: Arc<TradingService>,
}

#[derive(Debug, Deserialize)]
pub struct PlaceOrderRequest {
    pub stock_id: String,
    pub order_type: String,     // "market" or "limit"
    pub order_side: String,     // "buy" or "sell"
    pub quantity: i64,
    pub price: Option<f64>,     // Required for limit orders
}

#[derive(Debug, Deserialize)]
pub struct OrderQuery {
    pub status: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: i32,
}

fn default_limit() -> i32 {
    50
}

#[derive(Debug, Serialize)]
pub struct OrderResponse {
    pub order: Order,
    pub message: String,
}

pub fn routes(state: Arc<TradingState>) -> Router {
    Router::new()
        .route("/orders", get(get_orders).post(place_order))
        .route("/orders/:id", get(get_order))
        .route("/orders/:id/cancel", post(cancel_order))
        .route("/orderbook/:stock_id", get(get_order_book))
        .with_state(state)
}

async fn place_order(
    State(state): State<Arc<TradingState>>,
    current_user: CurrentUser,
    Json(req): Json<PlaceOrderRequest>,
) -> AppResult<Json<OrderResponse>> {
    let order_type = OrderType::from_str(&req.order_type)
        .ok_or_else(|| AppError::ValidationError("Invalid order type".to_string()))?;

    let order_side = OrderSide::from_str(&req.order_side)
        .ok_or_else(|| AppError::ValidationError("Invalid order side".to_string()))?;

    let order = state
        .trading_service
        .place_order(
            &current_user.0.user_id,
            &req.stock_id,
            order_type,
            order_side,
            req.quantity,
            req.price,
        )
        .await?;

    let message = match order.status.as_str() {
        "filled" => "Order executed successfully".to_string(),
        "pending" => "Order placed and waiting for execution".to_string(),
        "partial" => "Order partially filled".to_string(),
        _ => "Order processed".to_string(),
    };

    Ok(Json(OrderResponse { order, message }))
}

async fn get_orders(
    State(state): State<Arc<TradingState>>,
    current_user: CurrentUser,
    Query(query): Query<OrderQuery>,
) -> AppResult<Json<Vec<Order>>> {
    let orders = state
        .trading_service
        .get_orders(&current_user.0.user_id, query.status.as_deref(), query.limit)
        .await?;
    Ok(Json(orders))
}

async fn get_order(
    State(state): State<Arc<TradingState>>,
    current_user: CurrentUser,
    Path(id): Path<String>,
) -> AppResult<Json<Order>> {
    let orders = state
        .trading_service
        .get_orders(&current_user.0.user_id, None, 1000)
        .await?;

    let order = orders
        .into_iter()
        .find(|o| o.id == id)
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    Ok(Json(order))
}

async fn cancel_order(
    State(state): State<Arc<TradingState>>,
    current_user: CurrentUser,
    Path(id): Path<String>,
) -> AppResult<Json<OrderResponse>> {
    let order = state
        .trading_service
        .cancel_order(&current_user.0.user_id, &id)
        .await?;

    Ok(Json(OrderResponse {
        order,
        message: "Order cancelled successfully".to_string(),
    }))
}

async fn get_order_book(
    State(state): State<Arc<TradingState>>,
    Path(stock_id): Path<String>,
) -> AppResult<Json<OrderBook>> {
    let order_book = state.trading_service.get_order_book(&stock_id).await?;
    Ok(Json(order_book))
}

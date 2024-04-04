use hyperliquid_rust_sdk::{AssetPosition, ExchangeClient, InfoClient};
use reqwest::Proxy;
use uuid::Uuid;

#[derive(Clone)]
pub struct DefaultPair {
    pub asset: String,
    pub reduce_only: bool,
    pub sz: f64,
    pub order_type: String,
}

pub enum OrderType {
    Position,
    Limit,
    ClosePosition(String),
}

impl OrderType {
    pub fn title(&self) -> String {
        match self {
            OrderType::Position => "Market Position".to_string(),
            OrderType::Limit => "Limit Order".to_string(),
            OrderType::ClosePosition(s) => format!("Close Position {}", s),
        }
    }
}

pub struct Position {
    pub id: Uuid,
    pub asset_position: AssetPosition,
}

pub struct Account {
    pub public_address: String,
    pub private_api_key: String,
    pub proxy: Proxy,
}

pub struct Handlers {
    pub info_client: InfoClient,
    pub exchange_client: ExchangeClient,
    pub public_address: String,
}

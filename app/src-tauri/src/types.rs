use hyperliquid_rust_sdk::{AssetPosition, ExchangeClient, InfoClient};
use reqwest::Proxy;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::task::JoinHandle;
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
    pub asset_position: Option<AssetPosition>,
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

pub struct Asset {
    pub name: &'static str,
    pub round_n: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileAccount {
    pub name: String,
    pub public_address: String,
    pub api_private_key: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileProxy {
    pub name: String,
    pub host: String,
    pub port: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct BatchAccount {
    pub account: FileAccount,
    pub proxy: Option<FileProxy>,
}

#[derive(Clone, Debug)]
pub struct GlobalAccount {
    pub sub_id: Option<u32>,
    pub account: BatchAccount,
}

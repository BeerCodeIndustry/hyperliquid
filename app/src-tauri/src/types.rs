use std::collections::HashMap;

use ethers::signers::LocalWallet;
use hyperliquid_rust_sdk::{AssetPosition, ExchangeClient, InfoClient};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug)]
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
#[derive(Debug)]
pub struct Account {
    pub public_address: String,
    pub wallet: LocalWallet,
    pub client: Client,
}

pub struct Handlers {
    pub info_client: InfoClient,
    pub exchange_client: ExchangeClient,
    pub public_address: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AccountDTO {
    pub name: String,
    pub public_address: String,
    pub api_private_key: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProxyDTO {
    pub host: String,
    pub port: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct BatchAccount {
    pub account: AccountDTO,
    pub proxy: Option<ProxyDTO>,
}

#[derive(Clone, Debug)]
pub struct GlobalAccount {
    pub sub_id: Option<u32>,
    pub account: BatchAccount,
}
#[derive(Deserialize, Debug, Clone)]
pub struct Unit {
    pub asset: String,
    pub sz: f64,
    pub leverage: u32,
    pub sz_decimals: u32,
    pub smart_balance_usage: bool,
}

#[derive(Debug, Clone, Copy)]
pub struct RandK {
    pub k: i32,
    pub is_fat: bool,
}

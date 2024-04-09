use ethers::types::H160;
use hyperliquid_rust_sdk::{AssetPosition, InfoClient, Message, Subscription, UserStateResponse};

use log::info;
use rust_decimal::prelude::ToPrimitive;
use std::{collections::HashMap, str::FromStr};
use tokio::sync::mpsc::unbounded_channel;

use crate::utils::num::round_num_by_hyper_liquid;

const DEFAULT_SLIPPAGE: f64 = 0.001; // 0.001 0.1%
const FEES: f64 = 0.000336; // 0.000336
const BALANCE_LIMIT: f64 = 10.0; // TODO: change to 50.0

pub async fn get_user_state(info_client: &InfoClient, public_address: &str) -> UserStateResponse {
    let user: String = public_address.parse().unwrap();
    let user = H160::from_str(&user).unwrap();

    info_client.user_state(user).await.unwrap()
}

pub async fn get_position(
    info_client: &InfoClient,
    public_address: &str,
    asset: &str,
) -> Option<AssetPosition> {
    let user: String = public_address.parse().unwrap();
    let user = H160::from_str(&user).unwrap();

    info_client
        .user_state(user)
        .await
        .unwrap()
        .asset_positions
        .into_iter()
        .find(|pos| pos.position.coin == asset)
}

pub async fn get_account_balance(info_client: &InfoClient, public_address: &str) -> String {
    let user: String = public_address.parse().unwrap();
    let user = H160::from_str(&user).unwrap();

    info_client
        .user_state(user)
        .await
        .unwrap()
        .margin_summary
        .account_value
}

pub async fn get_all_mids(info_client: &InfoClient) -> HashMap<String, String> {
    info_client.all_mids().await.unwrap()
}

pub async fn slippage_price(
    info_client: &InfoClient,
    asset: &str,
    is_buy: bool,
    px: Option<f64>,
) -> f64 {
    let coin_mid_price = &get_all_mids(info_client).await[asset];

    let mut cpx: f64;

    if px.is_none() {
        cpx = coin_mid_price.parse::<f64>().unwrap();
    } else {
        cpx = px.unwrap();
    }

    cpx *= if is_buy {
        1.0 + DEFAULT_SLIPPAGE
    } else {
        1.0 - DEFAULT_SLIPPAGE
    };

    round_num_by_hyper_liquid(cpx)
}

pub async fn can_open_position(
    info_client: &InfoClient,
    public_address: &str,
    asset: &str,
    sz: f64,
    leverage: u32,
) -> bool {
    let (asset_mid_price, balance) = tokio::join!(
        get_all_mids(info_client),
        get_account_balance(info_client, public_address)
    );
    let asset_mid_price = &asset_mid_price[asset];
    let price_by_asset = (1.0 + DEFAULT_SLIPPAGE) * asset_mid_price.parse::<f64>().unwrap();
    let full_amount =
        sz * (1.0 - FEES) * price_by_asset / leverage.to_f64().unwrap() + BALANCE_LIMIT;

    balance.parse::<f64>().unwrap() >= full_amount
}

pub async fn subscribe_positions(info_client: &mut InfoClient, public_address: &str) {
    let (sender, mut receiver) = unbounded_channel::<Message>();
    let user = H160::from_str(public_address).unwrap();

    let subscription_id = info_client
        .subscribe(Subscription::AllMids, sender)
        .await
        .unwrap();

    while let Some(Message::AllMids(all_mids)) = receiver.recv().await {
        info!("Received order updates: {:?}", all_mids);
    }
}

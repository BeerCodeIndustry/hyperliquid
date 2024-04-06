use ethers::types::H160;
use hyperliquid_rust_sdk::{AssetPosition, InfoClient, Message, Subscription};
use itertools::Itertools;
use log::info;
use std::{collections::HashMap, str::FromStr};
use tokio::{
    spawn,
    sync::mpsc::unbounded_channel,
    time::{sleep, Duration},
};

use crate::utils::num::round_num_by_hyper_liquid;

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
    const DEFAULT_SLIPPAGE: f64 = 0.001; // 0.1%

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
) -> bool {
    const BALANCE_LIMIT: f64 = 10.0; // TODO: change to 50.0
    const DEFAULT_SLIPPAGE: f64 = 0.001;
    const FEES: f64 = 0.000336;
    let asset_mid_price = &get_all_mids(info_client).await[asset];
    let balance = get_account_balance(info_client, public_address).await;
    let price_by_asset = (1.0 + DEFAULT_SLIPPAGE) * asset_mid_price.parse::<f64>().unwrap();
    let full_amount = sz * FEES * price_by_asset + BALANCE_LIMIT;

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

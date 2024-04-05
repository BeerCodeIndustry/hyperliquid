use ethers::types::H160;
use hyperliquid_rust_sdk::{AssetPosition, InfoClient};
use itertools::Itertools;
use log::info;
use std::{collections::HashMap, str::FromStr};

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

pub async fn get_all_mids(info_client: &InfoClient) -> HashMap<String, String> {
    info_client.all_mids().await.unwrap()
}

pub async fn slippage_price(
    info_client: &InfoClient,
    asset: &str,
    is_buy: bool,
    px: Option<f64>,
) -> f64 {
    const DEFAULT_SLIPPAGE: f64 = 0.001;

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

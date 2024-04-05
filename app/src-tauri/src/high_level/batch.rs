use ethers::prelude::*;
use hyperliquid_rust_sdk::{BaseUrl, ExchangeClient, InfoClient};
use log::info;
use reqwest::Client;
use uuid::Uuid;

use crate::actions::exchange::{open_limit_order, open_position};
use crate::actions::info::get_position;

use crate::types::{Account, DefaultPair, Handlers, Position};

async fn init_account(account: Account) -> Handlers {
    let Account {
        public_address,
        private_api_key,
        proxy,
    } = account;
    info!("Initializing Account: {public_address}");
    let wallet: LocalWallet = private_api_key.parse().unwrap();
    let proxy_req_client = Client::builder().proxy(proxy.clone()).build().unwrap();
    let info_client = InfoClient::new(Some(proxy_req_client.clone()), Some(BaseUrl::Mainnet))
        .await
        .unwrap();
    let exchange_client = ExchangeClient::new(
        Some(proxy_req_client.clone()),
        wallet,
        Some(BaseUrl::Mainnet),
        None,
        None,
    )
    .await
    .unwrap();

    Handlers {
        info_client,
        exchange_client,
        public_address,
    }
}

pub async fn create_batch(account_1: Account, account_2: Account) -> [Handlers; 2] {
    let batch_id = Uuid::new_v4();
    let handler_1 = init_account(account_1).await;
    let handler_2 = init_account(account_2).await;

    [handler_1, handler_2]
}

pub async fn create_unit(
    handler_1: Handlers,
    handler_2: Handlers,
    asset: &str,
    sz: f64,
    leverage: u32,
) {
    let sz = sz * leverage as f64;
    let Handlers {
        info_client: info_client_1,
        exchange_client: exchange_client_1,
        public_address: public_address_1,
    } = handler_1;

    let Handlers {
        info_client: info_client_2,
        exchange_client: exchange_client_2,
        public_address: public_address_2,
    } = handler_2;

    let _ = exchange_client_1
        .update_leverage(leverage, asset, false, None)
        .await;

    let _ = exchange_client_2
        .update_leverage(leverage, asset, false, None)
        .await;

    let position_pair = DefaultPair {
        asset: asset.to_string(),
        sz,
        reduce_only: false,
        order_type: "FrontendMarket".to_string(),
    };

    let before_pos_1 = get_position(&info_client_1, &public_address_1, asset).await;
    let before_pos_2 = get_position(&info_client_2, &public_address_2, asset).await;

    if before_pos_1.is_some() || before_pos_2.is_some() {
        panic!("Position already exists");
    }

    let Position {
        asset_position: pos_1,
        id: id_pos_1,
    } = open_position(
        &exchange_client_1,
        &info_client_1,
        position_pair.clone(),
        public_address_1,
        true,
    )
    .await;

    let Position {
        asset_position: pos_2,
        id: id_pos_2,
    } = open_position(
        &exchange_client_2,
        &info_client_2,
        position_pair.clone(),
        public_address_2,
        false,
    )
    .await;

    open_limit_order(&pos_2, &exchange_client_1, &info_client_1).await;
    open_limit_order(&pos_1, &exchange_client_2, &info_client_2).await;

    // info!("Batch created: {batch_id} with positions: {id_pos_1} and {id_pos_2}");
}

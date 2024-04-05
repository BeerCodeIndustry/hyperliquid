use ethers::prelude::*;
use hyperliquid_rust_sdk::{BaseUrl, ExchangeClient, InfoClient};
use log::info;
use reqwest::{Client, Proxy};
use tokio::runtime::Handle;

use crate::actions::exchange::{open_limit_order, open_position};
use crate::actions::info::{can_open_position, get_position, subscribe_positions};
use crate::types::{Account, DefaultPair, FileProxy, Handlers, InitBatchAccount, Position};
use crate::utils::str::private_key_slice;

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

pub async fn get_batch_handlers(
    account1: InitBatchAccount,
    account2: InitBatchAccount,
) -> [Handlers; 2] {
    let default_proxy = FileProxy {
        name: "default_proxy".to_string(),
        host: "89.40.223.107".to_string(),
        port: "6143".to_string(),
        username: "gljdskgd".to_string(),
        password: "7qrarsn88jhk".to_string(),
    };

    let InitBatchAccount {
        account: account_1,
        proxy: proxy_1,
    } = account1;
    let InitBatchAccount {
        account: account_2,
        proxy: proxy_2,
    } = account2;

    let proxy_1 = proxy_1.unwrap_or(default_proxy.clone());
    let proxy_2 = proxy_2.unwrap_or(default_proxy.clone());

    let proxy_1 = Proxy::all(format!("{}:{}", proxy_1.host, proxy_1.port))
        .unwrap()
        .basic_auth(&proxy_1.username, &proxy_1.password);

    let proxy_2 = Proxy::all(format!("{}:{}", proxy_2.host, proxy_2.port))
        .unwrap()
        .basic_auth(&proxy_2.username, &proxy_2.password);

    let private_api_key_1 = private_key_slice(&account_1.api_private_key);
    let private_api_key_2 = private_key_slice(&account_2.api_private_key);

    let handler_1 = init_account(Account {
        public_address: account_1.public_address.to_string(),
        private_api_key: private_api_key_1.to_string(),
        proxy: proxy_1.clone(),
    })
    .await;
    let handler_2 = init_account(Account {
        public_address: account_2.public_address.to_string(),
        private_api_key: private_api_key_2.to_string(),
        proxy: proxy_2.clone(),
    })
    .await;

    [handler_1, handler_2]
}

#[tauri::command]
pub async fn init_batch(account1: InitBatchAccount, account2: InitBatchAccount) {
    let [handler_1, handler_2] = get_batch_handlers(account1, account2).await;

    let Handlers {
        info_client: mut info_client_1,
        exchange_client: exchange_client_1,
        public_address: public_address_1,
    } = handler_1;

    subscribe_positions(&mut info_client_1, &public_address_1).await;
}

#[tauri::command]
pub async fn create_unit(
    account1: InitBatchAccount,
    account2: InitBatchAccount,
    asset: String,
    sz: f64,
    leverage: u32,
) {
    let [handler_1, handler_2] = get_batch_handlers(account1, account2).await;
    let sz = sz * leverage as f64;
    let Handlers {
        info_client: mut info_client_1,
        exchange_client: exchange_client_1,
        public_address: public_address_1,
    } = handler_1;

    let Handlers {
        info_client: info_client_2,
        exchange_client: exchange_client_2,
        public_address: public_address_2,
    } = handler_2;

    let can_open_1 = can_open_position(&info_client_1, &public_address_1, &asset, sz).await;
    let can_open_2 = can_open_position(&info_client_2, &public_address_2, &asset, sz).await;

    if !can_open_1 {
        info!("Cannot open position for {public_address_1}, not enough balance");

        return;
    }

    if !can_open_2 {
        info!("Cannot open position for {public_address_1}, not enough balance");

        return;
    }

    let _ = exchange_client_1
        .update_leverage(leverage, &asset, false, None)
        .await;

    let _ = exchange_client_2
        .update_leverage(leverage, &asset, false, None)
        .await;

    let position_pair = DefaultPair {
        asset: asset.to_string(),
        sz,
        reduce_only: false,
        order_type: "FrontendMarket".to_string(),
    };

    let before_pos_1 = get_position(&info_client_1, &public_address_1, &asset).await;
    let before_pos_2 = get_position(&info_client_2, &public_address_2, &asset).await;

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
}

#[tauri::command]
pub async fn close_unit() {}

//   const proxy_1 = getAccountProxy(account_1)!;
//   const proxy_2 = getAccountProxy(account_2)!;

//   invoke("create_unit", {
//     account1: { account: account_1, proxy: proxy_1 },
//     account2: { account: account_2, proxy: proxy_2 },
//     asset: "MATIC",
//     sz: 20.0,
//     leverage: 10,
//   }).catch((e) => console.log(e));

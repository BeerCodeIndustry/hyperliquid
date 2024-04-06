use async_recursion::async_recursion;
use ethers::prelude::*;
use hyperliquid_rust_sdk::{BaseUrl, ExchangeClient, InfoClient};
use log::{error, info, warn};
use reqwest::{Client, Proxy};

use crate::actions::exchange::{close_position, open_limit_order, open_position};
use crate::actions::info::{can_open_position, get_position};
use crate::types::{Account, BatchAccount, DefaultPair, FileProxy, Handlers, Position};
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

pub async fn get_batch_handler(account: BatchAccount) -> Handlers {
    let default_proxy = FileProxy {
        name: "default_proxy".to_string(),
        host: "89.40.223.107".to_string(),
        port: "6143".to_string(),
        username: "gljdskgd".to_string(),
        password: "7qrarsn88jhk".to_string(),
    };

    let BatchAccount { account, proxy } = account;

    let proxy = proxy.unwrap_or(default_proxy.clone());

    let proxy = Proxy::all(format!("{}:{}", proxy.host, proxy.port))
        .unwrap()
        .basic_auth(&proxy.username, &proxy.password);

    let private_api_key = private_key_slice(&account.api_private_key);

    init_account(Account {
        public_address: account.public_address.to_string(),
        private_api_key: private_api_key.to_string(),
        proxy: proxy.clone(),
    })
    .await
}

#[tauri::command]
pub async fn create_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    asset: String,
    sz: f64,
    leverage: u32,
) {
    warn!(
        "Creating unit for {}, {} asset: {}",
        account1.account.public_address, account2.account.public_address, asset
    );
    let [handler_1, handler_2] = [
        get_batch_handler(account1.clone()).await,
        get_batch_handler(account2.clone()).await,
    ];
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

    let can_open_1 = can_open_position(&info_client_1, &public_address_1, &asset, sz).await;
    let can_open_2 = can_open_position(&info_client_2, &public_address_2, &asset, sz).await;

    if !can_open_1 {
        warn!("Cannot open position for {public_address_1}, not enough balance");

        return;
    }

    if !can_open_2 {
        warn!("Cannot open position for {public_address_1}, not enough balance");

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
        error!("Unit already exists for {public_address_1}, {public_address_2}");
    }

    let Position {
        asset_position: pos_1,
        id: id_pos_1,
    } = open_position(
        &exchange_client_1,
        &info_client_1,
        position_pair.clone(),
        public_address_1.clone(),
        true,
    )
    .await;

    if pos_1.is_none() {
        warn!("Position not opened for {public_address_1}");
        return;
    }

    let Position {
        asset_position: pos_2,
        id: id_pos_2,
    } = open_position(
        &exchange_client_2,
        &info_client_2,
        position_pair.clone(),
        public_address_2.clone(),
        false,
    )
    .await;

    if pos_2.is_none() {
        warn!("Position not opened for {public_address_2}");
        close_position(&pos_1.unwrap(), &exchange_client_1, &info_client_1).await;
        return;
    }

    let pos_1 = pos_1.unwrap();
    let pos_2 = pos_2.unwrap();

    if pos_1.position.szi.parse::<f64>().unwrap_or(0.0).abs()
        != pos_2.position.szi.parse::<f64>().unwrap_or(0.0).abs()
    {
        error!(
            "Positions for {public_address_1} & {public_address_2} on asset {asset} are not equal"
        );
        close_unit(account1, account2, asset).await;

        return;
    }

    // open_limit_order(&pos_2, &exchange_client_1, &info_client_1).await;
    // open_limit_order(&pos_1, &exchange_client_2, &info_client_2).await;
}

#[tauri::command]
pub async fn close_unit(account1: BatchAccount, account2: BatchAccount, asset: String) {
    warn!(
        "Closing unit for {}, {} asset: {}",
        account1.account.public_address, account2.account.public_address, asset
    );
    let [handler_1, handler_2] = [
        get_batch_handler(account1).await,
        get_batch_handler(account2).await,
    ];

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

    let pos_1 = get_position(&info_client_1, &public_address_1, &asset).await;

    if pos_1.is_some() {
        close_position(&pos_1.unwrap(), &exchange_client_1, &info_client_1).await;
    }

    let pos_2 = get_position(&info_client_2, &public_address_2, &asset).await;

    if pos_2.is_some() {
        close_position(&pos_2.unwrap(), &exchange_client_2, &info_client_2).await;
    }
}

#[tauri::command]
pub async fn close_and_create_same_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    asset: String,
    sz: f64,
    leverage: u32,
) {
    warn!("Invoke close_and_create_same_unit");
    let [handler_1, handler_2] = [
        get_batch_handler(account1.clone()).await,
        get_batch_handler(account2.clone()).await,
    ];

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

    let pos_1 = get_position(&info_client_1, &public_address_1, &asset).await;
    let pos_2 = get_position(&info_client_2, &public_address_2, &asset).await;

    if pos_1.is_none() && pos_2.is_none() {
        warn!("No position to close");
        return;
    }

    if pos_1.is_some() {
        close_position(&pos_1.unwrap(), &exchange_client_1, &info_client_1).await;
    }

    if pos_2.is_some() {
        close_position(&pos_2.unwrap(), &exchange_client_2, &info_client_2).await;
    }

    create_unit(account1, account2, asset, sz, leverage).await;
}

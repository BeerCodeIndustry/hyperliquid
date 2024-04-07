use ethers::signers::LocalWallet;
use hyperliquid_rust_sdk::{BaseUrl, ExchangeClient, InfoClient};
use reqwest::{Client, Proxy};

use crate::types::{Account, BatchAccount, Handlers, ProxyDTO};
use crate::utils::str::private_key_slice;

pub fn get_account(account: BatchAccount) -> Account {
    let default_proxy = ProxyDTO {
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

    let wallet: LocalWallet = private_api_key.parse().unwrap();
    let client = Client::builder().proxy(proxy.clone()).build().unwrap();

    Account {
        public_address: account.public_address.to_string(),
        wallet,
        client,
    }
}

pub async fn get_info_client(account: &Account) -> InfoClient {
    InfoClient::new(Some(account.client.clone()), Some(BaseUrl::Mainnet))
        .await
        .unwrap()
}

pub async fn get_exchange_client(account: &Account) -> ExchangeClient {
    ExchangeClient::new(
        Some(account.client.clone()),
        account.wallet.clone(),
        Some(BaseUrl::Mainnet),
        None,
        None,
    )
    .await
    .unwrap()
}

pub async fn get_batch_account_handlers(batch_account: BatchAccount) -> Handlers {
    let account = get_account(batch_account);

    let (info_client, exchange_client) =
        tokio::join!(get_info_client(&account), get_exchange_client(&account));

    Handlers {
        info_client,
        exchange_client,
        public_address: account.public_address.clone(),
    }
}

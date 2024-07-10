use ethers::signers::LocalWallet;
use hyperliquid_rust_sdk::{BaseUrl, ExchangeClient, InfoClient};
use reqwest::{Client, Proxy};

use crate::types::{Account, BatchAccount, Handlers, ProxyDTO};
use crate::utils::str::private_key_slice;
use log::error;

pub fn get_account(account: BatchAccount) -> Result<Account, String> {
    let default_proxy = ProxyDTO {
        host: "89.40.223.107".to_string(),
        port: "6143".to_string(),
        username: "gljdskgd".to_string(),
        password: "7qrarsn88jhk".to_string(),
    };

    let BatchAccount { account, proxy } = account;

    let proxy = proxy.unwrap_or(default_proxy.clone());

    let proxy_client = Proxy::all(format!("{}:{}", proxy.host, proxy.port));

    if proxy_client.is_err() {
        error!("Error creating proxy for {}", account.public_address);

        return Err(format!(
            "Error creating proxy for {}",
            account.public_address
        ));
    }

    let proxy_client = proxy_client
        .unwrap()
        .basic_auth(&proxy.username, &proxy.password);

    let private_api_key = private_key_slice(&account.api_private_key);

    let wallet: LocalWallet = private_api_key.parse().unwrap();
    let client = Client::builder().proxy(proxy_client.clone()).build();

    if client.is_err() {
        error!("Error creating client for {}", account.public_address);

        return Err(format!(
            "Error creating client for {}",
            account.public_address
        ));
    }

    Ok(Account {
        public_address: account.public_address.to_string(),
        wallet,
        client: client.unwrap(),
    })
}

pub async fn get_info_client(account: &Account) -> Result<InfoClient, String> {
    match InfoClient::new(Some(account.client.clone()), Some(BaseUrl::Mainnet)).await {
        Ok(info_client) => Ok(info_client),
        Err(e) => {
            error!(
                "Error creating info client for {} e: {:?}",
                account.public_address, e
            );

            Err("Error creating info client".to_string())
        }
    }
}

pub async fn get_exchange_client(account: &Account) -> Result<ExchangeClient, String> {
    match ExchangeClient::new(
        Some(account.client.clone()),
        account.wallet.clone(),
        Some(BaseUrl::Mainnet),
        None,
        None,
    )
    .await
    {
        Ok(exchange_client) => Ok(exchange_client),
        Err(e) => {
            error!(
                "Error creating exchange client for {}: {:?}",
                account.public_address, e
            );

            Err("Error creating exchange client".to_string())
        }
    }
}

pub async fn get_batch_account_handlers(batch_account: BatchAccount) -> Result<Handlers, String> {
    let account = get_account(batch_account.clone());

    if account.is_err() {
        let e = account.unwrap_err();
        return Err(format!("{}", e));
    }

    let account = account.unwrap();

    let (info_client, exchange_client) =
        tokio::join!(get_info_client(&account), get_exchange_client(&account));

    if info_client.is_err() || exchange_client.is_err() {
        return Err(format!(
            "Error creating handlers {}",
            batch_account.account.public_address
        ));
    }

    Ok(Handlers {
        info_client: info_client.unwrap(),
        exchange_client: exchange_client.unwrap(),
        public_address: account.public_address.clone(),
    })
}


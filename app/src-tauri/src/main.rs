// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::Proxy;
use serde::{Deserialize, Serialize};

mod actions;
mod high_level;
mod types;
mod utils;

use high_level::batch::create_batch;
use utils::local_db::{
    add_account, add_proxy, link_account_proxy, parse_account_proxy, parse_accounts, parse_proxy,
};

use types::{Account, FileAccount, FileProxy};

#[derive(Deserialize)]
struct InitBatchAccount {
    account: FileAccount,
    proxy: Option<FileProxy>,
}

#[tauri::command]
async fn init_batch(account1: InitBatchAccount, account2: InitBatchAccount) {
    // let default_proxy = Proxy::all("89.40.223.107:6143")
    //     .unwrap()
    //     .basic_auth("gljdskgd", "7qrarsn88jhk");

    // // let proxy_1 = Proxy::all("89.40.223.107:6143")
    // //     .unwrap()
    // //     .basic_auth("gljdskgd", "7qrarsn88jhk");
    // // let proxy_2 = Proxy::all("89.40.222.208:6584")
    // //     .unwrap()
    // //     .basic_auth("gljdskgd", "7qrarsn88jhk");

    // let InitBatchAccount {
    //     account: account_1,
    //     proxy: proxy_1,
    // } = account1;
    // let InitBatchAccount {
    //     account: account_2,
    //     proxy: proxy_2,
    // } = account2;

    // let proxy_1 = proxy_1.unwrap_or(default_proxy);
    // let proxy_2 = proxy_2.unwrap_or(default_proxy);

    // let proxy_1 = Proxy::all(format!("{}:{}", proxy_1.ip, proxy_1.port))
    //     .unwrap()
    //     .basic_auth(&proxy_1.login, &proxy_1.pass);

    // let proxy_2 = Proxy::all(format!("{}:{}", proxy_2.ip, proxy_2.port))
    //     .unwrap()
    //     .basic_auth(&proxy_2.login, &proxy_2.pass);

    // let private_api_key_1 = if account_1.api_private_key.starts_with("0x") {
    //     &account_1.api_private_key[2..]
    // } else {
    //     &account_1.api_private_key
    // };

    // let private_api_key_2 = if account_2.api_private_key.starts_with("0x") {
    //     &account_2.api_private_key[2..]
    // } else {
    //     &account_2.api_private_key
    // };

    // create_batch(
    //     Account {
    //         public_address: account_1.public_address.to_string(),
    //         private_api_key: private_api_key_1.to_string(),
    //         proxy: proxy_1.clone(),
    //     },
    //     Account {
    //         public_address: account_2.public_address.to_string(),
    //         private_api_key: private_api_key_2.to_string(),
    //         proxy: proxy_2.clone(),
    //     },
    //     "AVAX",
    //     1.0, // basic amount of tokens
    //     5,   // leverage
    // )
    // .await;
}

fn main() {
    dotenv::dotenv().ok();
    env_logger::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_batch,
            add_account,
            parse_accounts,
            add_proxy,
            parse_proxy,
            link_account_proxy,
            parse_account_proxy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod actions;
mod high_level;
mod types;
mod utils;

use high_level::batch::create_unit;
use utils::local_db::{
    add_account, add_proxy, link_account_proxy, parse_account_proxy, parse_accounts, parse_proxy,
};

fn main() {
    dotenv::dotenv().ok();
    env_logger::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_unit,
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

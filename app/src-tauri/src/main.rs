// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod actions;
mod high_level;
mod types;
mod utils;

use high_level::batch::{close_unit, create_unit};

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    env_logger::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_unit, close_unit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

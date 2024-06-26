// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod actions;
mod dto_types;
mod high_level;
mod services;
mod types;
mod utils;

use fern::colors::{Color, ColoredLevelConfig};
use high_level::batch::{close_and_create_same_unit, close_unit, create_unit};
use high_level::info::get_asset_price;
use high_level::logs::{clear_logs, get_logs};
use high_level::unit::get_unit_user_states;
use log::LevelFilter;

fn setup_logger() -> Result<(), fern::InitError> {
    let colors = ColoredLevelConfig::new()
        .info(Color::Green)
        .warn(Color::Yellow)
        .error(Color::Red)
        .debug(Color::Blue);

    fern::Dispatch::new()
        .level(LevelFilter::Info)
        .format(move |out, message, record| {
            out.finish(format_args!(
                "{}[{}][{}] {}",
                chrono::Local::now().format("[%Y-%m-%d %H:%M:%S]"),
                record.target(),
                colors.color(record.level()),
                message
            ))
        })
        .chain(std::io::stdout())
        .chain(fern::log_file("logs.log")?)
        .apply()?;
    Ok(())
}

#[tokio::main]
async fn main() {
    setup_logger().expect("Error setting up logger");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_unit,
            close_unit,
            close_and_create_same_unit,
            get_logs,
            get_unit_user_states,
            get_asset_price,
            clear_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

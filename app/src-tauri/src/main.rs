// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod actions;
mod high_level;
mod hyper_types;
mod types;
mod utils;

use fern::colors::{Color, ColoredLevelConfig};
use high_level::batch::{close_and_create_same_unit, close_unit, create_unit};
use high_level::logs::get_logs;
use high_level::units::get_unit_user_states;
use log::LevelFilter;

fn setup_logger() -> Result<(), fern::InitError> {
    let colors = ColoredLevelConfig::new()
        .info(Color::Green)
        .warn(Color::Yellow)
        .error(Color::Red)
        .debug(Color::Blue);

    fern::Dispatch::new()
        .level(LevelFilter::Debug)
        .format(move |out, message, record| {
            out.finish(format_args!(
                "{}[{}][{}] {}",
                chrono::Local::now().format("[%Y-%m-%d][%H:%M:%S]"),
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
            get_unit_user_states
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

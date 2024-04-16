// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use fern::colors::{Color, ColoredLevelConfig};
use std::panic;

mod actions;
mod dto_types;
mod high_level;
mod services;
mod types;
mod utils;

use high_level::batch::{close_and_create_same_unit, close_unit, create_unit};
use high_level::info::{get_asset_price, get_asset_sz_decimals};
use high_level::logs::{clear_logs, get_logs};
use high_level::unit::get_unit_user_states;
use log::LevelFilter;
use types::{AccountDTO, BatchAccount, ProxyDTO, Unit};

fn setup_panic_handler() {
    panic::set_hook(Box::new(|panic_info| {
        // Получаем сообщение о панике или стандартный текст, если сообщение отсутствует
        let payload = panic_info
            .payload()
            .downcast_ref::<&str>()
            .unwrap_or(&"Unknown panic");

        // Опционально, можно получить и вывести местоположение паники
        let location = if let Some(location) = panic_info.location() {
            format!(" in file '{}' at line {}", location.file(), location.line())
        } else {
            String::from(" at unknown location")
        };

        // Логируем панику
        log::error!("Panic occurred: {}{}", payload, location);
    }));
}

fn setup_logger() -> Result<(), fern::InitError> {
    setup_panic_handler();

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

    // return create_unit(
    //     vec![
    //         BatchAccount {
    //             account: AccountDTO {
    //                 name: "account_1".to_string(),
    //                 public_address: "0xD14cf2c66f50845222C80a3d4910CdF147701B73".to_string(),
    //                 api_private_key:
    //                     "0x5d57f4591004358204c42a30c269d146f10d1b5c568129c406ff3ccfc5592b63"
    //                         .to_string(),
    //             },
    //             proxy: Some(ProxyDTO {
    //                 name: "proxy_1".to_string(),
    //                 host: "89.40.223.107".to_string(),
    //                 port: "6143".to_string(),
    //                 username: "gljdskgd".to_string(),
    //                 password: "7qrarsn88jhk".to_string(),
    //             }),
    //         },
    //         BatchAccount {
    //             account: AccountDTO {
    //                 name: "account_2".to_string(),
    //                 public_address: "0x19E2F720Cb47C3B6d14a5d6D800707e8DD72493f".to_string(),
    //                 api_private_key:
    //                     "0x5dc580da116d1d9654d0cf3c5363a039d199bf730fd391f5936fe72577562fae"
    //                         .to_string(),
    //             },
    //             proxy: Some(ProxyDTO {
    //                 name: "proxy_2".to_string(),
    //                 host: "89.40.222.208".to_string(),
    //                 port: "6584".to_string(),
    //                 username: "gljdskgd".to_string(),
    //                 password: "7qrarsn88jhk".to_string(),
    //             }),
    //         },
    //         BatchAccount {
    //             account: AccountDTO {
    //                 name: "account_3".to_string(),
    //                 public_address: "0xe67e147e7A1e38c8ddB09Fec75CF8a7676B5b9AF".to_string(),
    //                 api_private_key:
    //                     "0x0a7674aff4e8707114833c61945b94d114e141eac1b73ade5fe53fbf114dc7b4"
    //                         .to_string(),
    //             },
    //             proxy: Some(ProxyDTO {
    //                 name: "proxy_3".to_string(),
    //                 host: "89.35.80.206".to_string(),
    //                 port: "6861".to_string(),
    //                 username: "gljdskgd".to_string(),
    //                 password: "7qrarsn88jhk".to_string(),
    //             }),
    //         },
    //         BatchAccount {
    //             account: AccountDTO {
    //                 name: "account_4".to_string(),
    //                 public_address: "0x18B13868D3cA54CDF00793058F59daaCB607099e".to_string(),
    //                 api_private_key:
    //                     "0xb0f8d2033fe4c345be7325dea9749c155912c7e8d0cf2857a320a00fdf7defda"
    //                         .to_string(),
    //             },
    //             proxy: Some(ProxyDTO {
    //                 name: "proxy_4".to_string(),
    //                 host: "89.40.223.90".to_string(),
    //                 port: "6126".to_string(),
    //                 username: "gljdskgd".to_string(),
    //                 password: "7qrarsn88jhk".to_string(),
    //             }),
    //         },
    //     ],
    //     Unit {
    //         asset: "CRV".to_string(),
    //         sz: 200.8,
    //         leverage: 1,
    //         sz_decimals: 1,
    //     },
    // )
    // .await;

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_unit,
            close_unit,
            close_and_create_same_unit,
            get_logs,
            get_unit_user_states,
            get_asset_price,
            clear_logs,
            get_asset_sz_decimals
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use actions::account::{get_account, get_batch_account_handlers, get_info_client};
use actions::exchange::open_order;
use actions::info::{get_all_mids, get_l2_book};
use fern::colors::{Color, ColoredLevelConfig};
use std::panic;
use std::thread::sleep;
use std::time::Duration;
use utils::num::next_decimal;

mod actions;
mod dto_types;
mod high_level;
mod services;
mod types;
mod utils;

use high_level::batch::{close_and_create_same_unit, close_unit, create_unit};
use high_level::info::{get_asset_price, get_asset_sz_decimals, get_spot_assets_meta};
use high_level::logs::{clear_logs, get_logs};
use high_level::trader::{
    cancel_order, check_buy_order, check_sell_order, open_buy_order, open_sell_order,
};
use high_level::unit::get_unit_user_states;
use hyperliquid_rust_sdk::{ClientLimit, ClientOrder};
use log::{error, info, LevelFilter};
use types::{AccountDTO, BatchAccount, Bid, DefaultPair, ProxyDTO, Unit};

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

async fn buy_loop(batch_account: BatchAccount, bid: Bid) -> Result<(), String> {
    let mut buy_oid = open_buy_order(batch_account.clone(), bid.clone()).await?;

    loop {
        let new_oid = check_buy_order(batch_account.clone(), bid.clone(), buy_oid).await?;

        match new_oid {
            Some(new_oid) => {
                buy_oid = new_oid;
            }
            None => {
                info!("Buy order successfully filled");
                break;
            }
        }
    }

    Ok(())
}

async fn sell_loop(batch_account: BatchAccount, bid: Bid) -> Result<(), String> {
    let mut sell_oid = open_sell_order(batch_account.clone(), bid.clone()).await?;

    loop {
        let new_oid = check_sell_order(batch_account.clone(), bid.clone(), sell_oid).await?;

        match new_oid {
            Some(new_oid) => {
                sell_oid = new_oid;
            }
            None => {
                info!("Sell order successfully filled");
                break;
            }
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    setup_logger().expect("Error setting up logger");

    // let batch_account = BatchAccount {
    //     account: AccountDTO {
    //         name: "account_1".to_string(),
    //         public_address: "0xD14cf2c66f50845222C80a3d4910CdF147701B73".to_string(),
    //         api_private_key: "0x5d57f4591004358204c42a30c269d146f10d1b5c568129c406ff3ccfc5592b63"
    //             .to_string(),
    //     },
    //     proxy: Some(ProxyDTO {
    //         host: "89.40.223.107".to_string(),
    //         port: "6143".to_string(),
    //         username: "gljdskgd".to_string(),
    //         password: "7qrarsn88jhk".to_string(),
    //     }),
    // };

    // let rb = buy_loop(
    //     batch_account.clone(),
    //     Bid {
    //         asset: "PURR/USDC".to_string(),
    //         sz: 70.0,
    //         is_buy: true,
    //         coin_name: "PURR".to_string(),
    //         sz_decimals: 0,
    //     },
    // )
    // .await;

    // let rs = sell_loop(
    //     batch_account.clone(),
    //     Bid {
    //         asset: "PURR/USDC".to_string(),
    //         sz: 70.0,
    //         is_buy: false,
    //         coin_name: "PURR".to_string(),
    //         sz_decimals: 0,
    //     },
    // )
    // .await;

    // loop {
    //     match check_buy_order(batch_account.clone(), oid, "HFUN".to_string()).await {
    //         Ok(new_oid) => match new_oid {
    //             Some(new_oid) => {
    //                 oid = new_oid;
    //             }
    //             None => {
    //                 info!("Order successfully filled");
    //                 break;
    //             }
    //         },
    //         Err(e) => {
    //             error!("Error while checking order: {:?}", e);
    //             continue;
    //         }
    //     };

    //     sleep(Duration::from_secs(5));
    // }

    // let oid = open_spot_order(batch_account.clone(), Bid {
    //     asset: "PURR/USDC".to_string(),
    //     sz: 70.0,
    //     is_buy: true
    // }).await?;

    // loop {
    //     info!("check order");
    //     check_order_and_open_counter_order(batch_account.clone(), oid).await?;

    //     sleep(Duration::from_secs(5));
    // }

    // Ok(())

    // return create_unit(
    //     vec![
    // BatchAccount {
    //     account: AccountDTO {
    //         name: "account_1".to_string(),
    //         public_address: "0xD14cf2c66f50845222C80a3d4910CdF147701B73".to_string(),
    //         api_private_key:
    //             "0x5d57f4591004358204c42a30c269d146f10d1b5c568129c406ff3ccfc5592b63"
    //                 .to_string(),
    //     },
    //     proxy: Some(ProxyDTO {
    //         name: "proxy_1".to_string(),
    //         host: "89.40.223.107".to_string(),
    //         port: "6143".to_string(),
    //         username: "gljdskgd".to_string(),
    //         password: "7qrarsn88jhk".to_string(),
    //     }),
    // },
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
            get_asset_sz_decimals,
            open_buy_order,
            open_sell_order,
            check_buy_order,
            check_sell_order,
            cancel_order,
            get_spot_assets_meta,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

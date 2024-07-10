use crate::actions::account::get_batch_account_handlers;
use crate::actions::info::get_order_info;
use crate::services::trader::open_spot_order_service;
use crate::types::{BatchAccount, Bid};

use hyperliquid_rust_sdk::{OrderSide};
use log::error;

#[tauri::command]
pub async fn open_spot_order(batch_account: BatchAccount, bid: Bid) -> Result<u64, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;

    let oid = open_spot_order_service(&handlers, bid).await?;

    Ok(oid)
}

#[tauri::command]
pub async fn check_order_and_open_counter_order(batch_account: BatchAccount, oid: u64) -> Result<Option<u64>, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;
    let current_order = get_order_info(&handlers.info_client, &handlers.public_address, oid).await?;

    match current_order.status.as_str() {
        "filled" => {
            let oid = open_spot_order(batch_account, Bid {
                asset: current_order.order.coin.clone(),
                sz: current_order.order.orig_sz.parse::<f64>().unwrap(),
                is_buy: match current_order.order.side {
                    OrderSide::A => true,
                    OrderSide::B => false
                }
            }).await?;

            return Ok(Some(oid))
        }
        "open" => {
            return Ok(None)
        }
        _ => {}
    }

    Ok(None)
}


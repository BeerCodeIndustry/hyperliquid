use crate::actions::account::get_batch_account_handlers;
use crate::actions::exchange::{cancel_limit_order, modify_limit_order};
use crate::actions::info::{get_account_token_amount, get_l2_book, get_order_info};
use crate::services::trader::{modify_spot_order_service, open_spot_order_service};
use crate::types::{BatchAccount, Bid, OrderStatus};
use crate::utils::convert_types::convert_public_address;
use crate::utils::num::floor_to_precision;

use ethers::etherscan::account;
use hyperliquid_rust_sdk::{ClientLimit, ClientOrder, ClientOrderRequest, OrderSide};
use log::{error, info};
use rust_decimal::prelude::*;

#[tauri::command]
pub async fn open_sell_order(batch_account: BatchAccount, bid: Bid) -> Result<u64, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;
    let account_token_amount = get_account_token_amount(
        &handlers.info_client,
        &handlers.public_address,
        bid.coin_name.clone(),
    )
    .await?;

    let oid = open_spot_order_service(
        &handlers,
        Bid {
            asset: bid.asset.clone(),
            sz: floor_to_precision(account_token_amount, bid.sz_decimals),
            is_buy: bid.is_buy,
            sz_decimals: bid.sz_decimals,
            coin_name: bid.coin_name.clone(),
        },
    )
    .await?;

    Ok(oid)
}

#[tauri::command]
pub async fn open_buy_order(batch_account: BatchAccount, bid: Bid) -> Result<u64, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;

    let oid = open_spot_order_service(&handlers, bid).await?;

    Ok(oid)
}
// #[tauri::command]
// pub async fn check_order_and_open_counter_order(
//     batch_account: BatchAccount,
//     oid: u64,
// ) -> Result<u64, String> {
//     let handlers = get_batch_account_handlers(batch_account.clone()).await?;
//     let current_order =
//         get_order_info(&handlers.info_client, &handlers.public_address, oid).await?;

//     info!("Checking order: {:#?}", current_order);

//     match current_order.status {
//         OrderStatus::Filled => {
//             let oid = open_spot_order(
//                 batch_account,
//                 Bid {
//                     asset: current_order.order.coin.clone(),
//                     sz: current_order.order.orig_sz.parse::<f64>().unwrap(),
//                     is_buy: match current_order.order.side {
//                         OrderSide::A => true,
//                         OrderSide::B => false,
//                     },
//                 },
//             )
//             .await?;

//             return Ok(oid);
//         }
//         OrderStatus::Open => {
//             let oid = check_limit_and_reopen_order(batch_account, oid).await?;

//             return Ok(oid);
//         }
//         _ => return Err(format!("Smth went wrong with order")),
//     }
// }

#[tauri::command]
pub async fn check_limit_and_reopen_order(
    batch_account: BatchAccount,
    bid: Bid,
    oid: u64,
) -> Result<u64, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;
    let current_order =
        get_order_info(&handlers.info_client, &handlers.public_address, oid).await?;

    let order_book = get_l2_book(&handlers.info_client, &current_order.order.coin).await;

    let current_is_buy = match current_order.order.side {
        OrderSide::A => false,
        OrderSide::B => true,
    };
    let current_limit_px = current_order.order.limit_px.parse::<f64>().unwrap();
    let buy_order_book = &order_book[0];
    let sell_order_book = &order_book[1];

    let is_buy_order_book = match current_is_buy {
        true => &buy_order_book[2], // probably 1 ?
        false => &sell_order_book[2],
    };
    let order_book_limit_px = is_buy_order_book.px.parse::<f64>().unwrap();

    match current_is_buy {
        true => if current_limit_px <= order_book_limit_px {},
        false => if current_limit_px >= order_book_limit_px {},
    };

    let account_token_amount = get_account_token_amount(
        &handlers.info_client,
        &handlers.public_address,
        bid.coin_name.clone(),
    )
    .await?;

    info!("Account token amount: {:#?}", account_token_amount);

    let sz = match current_is_buy {
        true => bid.sz - account_token_amount,
        false => account_token_amount,
    };

    info!("current_order: {:#?}", current_order);

    let new_oid = modify_spot_order_service(
        &handlers,
        Bid {
            asset: current_order.order.coin,
            sz: floor_to_precision(sz, bid.sz_decimals),
            is_buy: current_is_buy,
            sz_decimals: bid.sz_decimals,
            coin_name: bid.coin_name.clone(),
        },
        oid,
    )
    .await?;

    // info!("Checking order: {:#?} {:#?}", current_order, order_book);

    Ok(new_oid)
}

#[tauri::command]
pub async fn cancel_order(batch_account: BatchAccount, oid: u64) -> Result<(), String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;
    let current_order =
        get_order_info(&handlers.info_client, &handlers.public_address, oid).await?;

    cancel_limit_order(&handlers.exchange_client, current_order.order.coin, oid).await?;

    Ok(())
}

#[tauri::command]
pub async fn check_sell_order(
    batch_account: BatchAccount,
    bid: Bid,
    oid: u64,
) -> Result<Option<u64>, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;
    let current_order =
        get_order_info(&handlers.info_client, &handlers.public_address, oid).await?;

    info!(
        "Checking sell order: {:#?} {:#?} {:#?}",
        current_order.status, current_order.order.sz, current_order.order.sz
    );

    match current_order.status {
        OrderStatus::Filled => Ok(None),
        OrderStatus::Open => {
            let oid = check_limit_and_reopen_order(batch_account, bid, oid).await?;

            return Ok(Some(oid));
        }
        _ => {
            error!("Order is not filled or open");

            return Err("Order is not filled or open".to_string());
        }
    }
}

#[tauri::command]
pub async fn check_buy_order(
    batch_account: BatchAccount,
    bid: Bid,
    oid: u64,
) -> Result<Option<u64>, String> {
    let handlers = get_batch_account_handlers(batch_account.clone()).await?;
    let current_order =
        get_order_info(&handlers.info_client, &handlers.public_address, oid).await?;

    info!(
        "Checking buy order: {:#?} {:#?} {:#?}",
        current_order.status, current_order.order.sz, current_order.order.sz
    );

    match current_order.status {
        OrderStatus::Filled => Ok(None),
        OrderStatus::Open => {
            let oid = check_limit_and_reopen_order(batch_account, bid, oid).await?;

            return Ok(Some(oid));
        }
        _ => {
            error!("Order is not filled or open");

            return Err("Order is not filled or open".to_string());
        }
    }
}

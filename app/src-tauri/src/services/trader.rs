use crate::actions::exchange::{cancel_limit_order, open_limit_order};
use crate::actions::info::get_l2_book;
use crate::types::{Bid, DefaultPair, Handlers};
use crate::utils::num::next_decimal;
use crate::utils::parsers::parse_l2_book;
use log::{error, info};

pub async fn open_spot_order_service(handlers: &Handlers, bid: Bid) -> Result<u64, String> {
    let price = parse_l2_book(
        get_l2_book(&handlers.info_client, &bid.asset).await,
        bid.is_buy,
    );

    let order = DefaultPair {
        asset: bid.asset,
        reduce_only: false,
        sz: bid.sz,
        order_type: "Gtc".to_string(),
    };

    let r = open_limit_order(
        order,
        &handlers.exchange_client,
        &handlers.info_client,
        bid.is_buy,
        Some(price),
    )
    .await?;

    Ok(r.oid)
}

pub async fn modify_spot_order_service(
    handlers: &Handlers,
    bid: Bid,
    oid: u64,
) -> Result<u64, String> {
    cancel_limit_order(&handlers.exchange_client, bid.asset.clone(), oid).await?;

    let price = parse_l2_book(
        get_l2_book(&handlers.info_client, &bid.asset).await,
        bid.is_buy,
    );

    let order = DefaultPair {
        asset: bid.asset,
        reduce_only: false,
        sz: bid.sz,
        order_type: "Gtc".to_string(),
    };

    let r = open_limit_order(
        order,
        &handlers.exchange_client,
        &handlers.info_client,
        bid.is_buy,
        Some(price),
    )
    .await?;

    Ok(r.oid)
}

use crate::actions::exchange::{open_limit_order};
use crate::actions::info::{get_l2_book};
use crate::types::{Bid, DefaultPair, Handlers};
use crate::utils::num::next_decimal;
use log::{info, error};

pub async fn open_spot_order_service(handlers: &Handlers, bid: Bid) -> Result<u64, String> {
    let price = get_l2_book(&handlers.info_client, &bid.asset, bid.is_buy).await;

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
        Some(price)
    ).await;

    if r.is_err() {
        error!("Error opening order: {:#?}", r);

        return Err(format!("Error opening order: {:#?}", r))
    }

    let r = r.unwrap();
    
    info!("{:#?}", r);

    Ok(r.oid)
}

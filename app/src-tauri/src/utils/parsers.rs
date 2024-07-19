use hyperliquid_rust_sdk::AssetPosition;

use crate::types::OrderBook;

pub fn parse_liq_px(pos: &AssetPosition) -> f64 {
    pos.position
        .liquidation_px
        .clone()
        .unwrap()
        .parse::<f64>()
        .unwrap()
}

pub fn parse_l2_book(orderBook: OrderBook, is_buy: bool) -> f64 {
    let buy = orderBook[0][0].clone();
    let sell = orderBook[1][0].clone();
    let price = if is_buy { buy.px } else { sell.px };

    price.parse::<f64>().unwrap()
}

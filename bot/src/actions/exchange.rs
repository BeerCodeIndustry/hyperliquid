use hyperliquid_rust_sdk::{
    AssetPosition, ClientLimit, ClientOrder, ClientOrderRequest, ExchangeClient,
    ExchangeResponseStatus, InfoClient,
};
use log::info;
use uuid::Uuid;

use crate::actions::info::slippage_price;

use crate::types::{DefaultPair, OrderType, Position};

use crate::utils::num::next_decimal;
use crate::utils::parsers::parse_liq_pos;

use super::info::get_position;

pub async fn open_order(
    default_pair: DefaultPair,
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
    is_buy: bool,
    limit_px: Option<f64>,
    order_type: OrderType,
) {
    let meta = info_client.meta().await.unwrap();
    let asset_sz_decimals = meta
        .universe
        .iter()
        .find(|x| x.name == default_pair.asset)
        .unwrap()
        .sz_decimals;

    let is_limit = limit_px.is_some();
    let limit_px = if is_limit {
        next_decimal(limit_px.unwrap(), is_buy, asset_sz_decimals)
    } else {
        slippage_price(
            info_client,
            &default_pair.asset,
            is_buy,
            None,
            asset_sz_decimals,
        )
        .await
    };

    info!("limit_px: {limit_px}");

    let order = ClientOrderRequest {
        sz: default_pair.sz,
        asset: default_pair.asset.clone(),
        is_buy,
        reduce_only: default_pair.reduce_only,
        order_type: ClientOrder::Limit(ClientLimit {
            tif: default_pair.order_type.clone(),
        }),
        limit_px,
    };

    let response = exchange_client.order(order, None).await.unwrap();
    let response = match response {
        ExchangeResponseStatus::Ok(exchange_response) => exchange_response,
        ExchangeResponseStatus::Err(e) => panic!("error with exchange response: {e}"),
    };
    info!("{}: {response:?}", order_type.title());
}

pub async fn close_position(
    position: &AssetPosition,
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
) {
    let asset = position.position.coin.clone();
    let sz = position.position.szi.clone().parse::<f64>().unwrap();
    let position_is_buy = if sz > 0.0 { true } else { false };
    let position_pair = DefaultPair {
        asset: asset.to_string(),
        sz: sz.abs(),
        reduce_only: false,
        order_type: "FrontendMarket".to_string(),
    };

    open_order(
        position_pair,
        exchange_client,
        info_client,
        !position_is_buy,
        None,
        OrderType::ClosePosition("pos".to_string()),
    )
    .await;
}

pub async fn open_limit_order(
    position: &AssetPosition,
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
) {
    let asset = position.position.coin.clone();
    let sz = position.position.szi.clone().parse::<f64>().unwrap();
    let position_is_buy = if sz > 0.0 { true } else { false };
    let limit_order_pair = DefaultPair {
        asset: asset.to_string(),
        sz: sz.abs(),
        reduce_only: true,
        order_type: "Gtc".to_string(),
    };
    let liq_pos = parse_liq_pos(position);

    open_order(
        limit_order_pair,
        exchange_client,
        info_client,
        position_is_buy,
        Some(liq_pos),
        OrderType::Limit,
    )
    .await;
}

pub async fn open_position(
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
    position_pair: DefaultPair,
    public_address: String,
    is_buy: bool,
) -> Position {
    open_order(
        position_pair.clone(),
        exchange_client,
        info_client,
        is_buy,
        None,
        OrderType::Position,
    )
    .await;
    let id = Uuid::new_v4();

    let position = get_position(info_client, &public_address, &position_pair.asset).await;

    if position.is_none() {
        panic!("Position not created {id}");
    }

    Position {
        asset_position: position.unwrap(),
        id,
    }
}

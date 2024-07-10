use async_recursion::async_recursion;
use hyperliquid_rust_sdk::{
    AssetPosition, ClientLimit, ClientOrder, ClientOrderRequest, ExchangeClient,
    ExchangeDataStatus, ExchangeResponseStatus, FilledOrder, InfoClient, RestingOrder,
};
use log::{error, info, warn};

use crate::actions::info::slippage_price;

use crate::types::DefaultPair;

use crate::utils::num::next_decimal;
use crate::utils::parsers::parse_liq_px;

use super::info::get_position;

pub async fn open_order(
    default_pair: DefaultPair,
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
    is_buy: bool,
    limit_px: Option<f64>,
) -> Result<FilledOrder, String> {
    let is_limit = limit_px.is_some();
    let limit_px = if is_limit {
        next_decimal(limit_px.unwrap(), is_buy)
    } else {
        slippage_price(info_client, &default_pair.asset, is_buy, None).await
    };

    let order = ClientOrderRequest {
        sz: default_pair.sz,
        cloid: None,
        asset: default_pair.asset.clone(),
        is_buy,
        reduce_only: default_pair.reduce_only,
        order_type: ClientOrder::Limit(ClientLimit {
            tif: default_pair.order_type.clone(),
        }),
        limit_px,
    };

    let response = exchange_client.order(order, None).await;

    info!("{:#?}", response);

    let response = response.unwrap();

    match response {
        ExchangeResponseStatus::Ok(exchange_response) => {
            match &exchange_response.data.unwrap().statuses[0] {
                ExchangeDataStatus::Error(e) => return Err(e.clone()),
                ExchangeDataStatus::Filled(f) => return Ok(f.clone()),
                _ => return Err("Smth went wrong with order".to_string()),
            }
        }
        ExchangeResponseStatus::Err(e) => {
            error!("Exchange error: {e:?}",);

            return Err("Exchange error".to_string());
        }
    };
}

#[async_recursion]
pub async fn close_position(
    position: &AssetPosition,
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
    public_address: String,
) -> Result<(), String> {
    let asset = position.position.coin.clone();
    let szi = position.position.szi.clone().parse::<f64>().unwrap();
    let position_is_buy = if szi > 0.0 { true } else { false };
    let position_pair = DefaultPair {
        asset: asset.to_string(),
        sz: szi.abs(),
        reduce_only: false,
        order_type: "FrontendMarket".to_string(),
    };

    info!("Closing position {position:?} for {public_address}, unit: {asset}");

    let r = open_order(
        position_pair,
        exchange_client,
        info_client,
        !position_is_buy,
        None,
    )
    .await;

    match r {
        Ok(f) => {
            if f.total_sz.parse::<f64>().unwrap() == szi.abs() {
                info!("Position closed for {public_address}, unit: {asset}, filled order: {f:?}");

                Ok(())
            } else {
                let new_pos = get_position(&info_client, &public_address, &asset)
                    .await
                    .unwrap();
                warn!("Position not fully closed for {public_address}, unit: {asset}, filled order: {f:?}");

                return close_position(&new_pos, exchange_client, info_client, public_address)
                    .await;
            }
        }
        Err(e) => {
            error!(
                "Smth went wrong with closing position: {e} for {public_address}, unit: {asset}"
            );

            return close_position(position, exchange_client, info_client, public_address).await;
        }
    }
}

pub async fn open_limit_order(
    default_pair: DefaultPair,
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
    is_buy: bool,
    limit_px: Option<f64>,
) -> Result<RestingOrder, String> {
    let is_limit = limit_px.is_some();
    let limit_px = if is_limit {
        next_decimal(limit_px.unwrap(), is_buy)
    } else {
        slippage_price(info_client, &default_pair.asset, is_buy, None).await
    };

    let order = ClientOrderRequest {
        sz: default_pair.sz,
        cloid: None,
        asset: default_pair.asset.clone(),
        is_buy,
        reduce_only: default_pair.reduce_only,
        order_type: ClientOrder::Limit(ClientLimit {
            tif: default_pair.order_type.clone(),
        }),
        limit_px,
    };

    let response = exchange_client.order(order, None).await;

    info!("{:#?}", response);

    let response = response.unwrap();

    match response {
        ExchangeResponseStatus::Ok(exchange_response) => {
            match &exchange_response.data.unwrap().statuses[0] {
                ExchangeDataStatus::Resting(r) => return Ok(r.clone()),
                ExchangeDataStatus::Error(e) => return Err(e.clone()),
                // ExchangeDataStatus::Filled(f) => return Ok(f.clone()),
                _ => return Err("Smth went wrong with order".to_string()),
            }
        }
        ExchangeResponseStatus::Err(e) => {
            error!("Exchange error: {e:?}",);

            return Err("Exchange error".to_string());
        }
    };
}

pub async fn open_position(
    exchange_client: &ExchangeClient,
    info_client: &InfoClient,
    position_pair: DefaultPair,
    public_address: String,
    is_buy: bool,
) -> Result<AssetPosition, String> {
    info!(
        "Opening position {position_pair:?} for {public_address}, unit: {}",
        position_pair.asset
    );

    let r = open_order(
        position_pair.clone(),
        exchange_client,
        info_client,
        is_buy,
        None,
    )
    .await;

    match r {
        Ok(f) => {
            let pos = get_position(info_client, &public_address, &position_pair.asset)
                .await
                .unwrap();

            if pos.position.szi.parse::<f64>().unwrap().abs() != position_pair.sz {
                error!("Current opened position size and requested size are not equal for {public_address}, 
                unit: {}, filled: {f:?}, current position: {pos:?}", position_pair.asset);

                close_position(&pos, exchange_client, info_client, public_address.clone()).await;

                return Err(format!(
                    "Current opened position size and requested size are not equal for {public_address}, 
                    unit: {}, filled: {f:?}, current position: {pos:?}", position_pair.asset
                ));
            }

            if position_pair.sz != f.total_sz.parse::<f64>().unwrap() {
                error!(
                    "Position not fully opened for {public_address}, unit: {}, filled: {f:?}",
                    position_pair.asset
                );

                close_position(&pos, exchange_client, info_client, public_address.clone()).await;

                return Err(format!(
                    "Position not fully opened for {public_address}, unit: {}",
                    position_pair.asset
                ));
            }

            info!(
                "Position opened for {public_address}, unit: {}, filled: {f:?}, current position: {pos:?}",
                position_pair.asset
            );

            return Ok(pos);
        }
        Err(e) => {
            error!("{e} for {public_address} unit: {}", position_pair.asset);

            return Err(e);
        }
    }
}

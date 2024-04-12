use futures::future::{self, join_all, FutureExt};
use itertools::Itertools;
use log::{error, info, warn};
use rust_decimal::prelude::*;

use crate::actions::exchange::{close_position, open_position};
use crate::actions::info::{can_open_position, get_position};
use crate::types::{DefaultPair, Handlers, Unit};
use crate::utils::rand::{get_rand_is_buy_fat, get_rand_k_4, get_rand_k_6};

pub async fn create_unit_service(handlers: &Vec<Handlers>, unit: Unit) -> Result<(), String> {
    let Unit {
        asset,
        sz,
        leverage,
        sz_decimals,
    } = unit;

    warn!(
        "Creating unit for {}, unit: {}",
        handlers
            .iter()
            .map(|h| h.public_address.clone())
            .join(" & "),
        asset
    );

    let sz = sz * leverage as f64;

    let cos = join_all(handlers.iter().map(|h| {
        can_open_position(&h.info_client, &h.public_address, &asset, sz, leverage)
            .map(move |r| (r, h))
    }))
    .await;

    if let Some((_, h)) = cos.iter().find(|(b, _)| !b) {
        error!(
            "Cannot open position for {}, not enough balance, unit: {asset}",
            h.public_address
        );

        return Err(format!(
            "Cannot open position for {}, not enough balance, unit: {asset}",
            h.public_address
        ));
    }

    let _ = join_all(handlers.iter().map(|h| {
        h.exchange_client
            .update_leverage(leverage, &asset, false, None)
    }))
    .await;

    let bps = join_all(
        handlers
            .iter()
            .map(|h| get_position(&h.info_client, &h.public_address, &asset)),
    )
    .await;

    if bps.iter().any(|bp| bp.is_some()) {
        error!(
            "Unit already exists for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & ")
        );

        return Err(format!(
            "Unit already exists for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & ")
        ));
    }

    let rand_is_buy_fat = get_rand_is_buy_fat();
    let rand_ks = if handlers.len() == 4 {
        get_rand_k_4()
    } else {
        get_rand_k_6()
    };

    let poss = join_all(handlers.iter().enumerate().map(|(i, h)| {
        let k = rand_ks[i] as f64;
        let is_buy = if k == 100.0 {
            rand_is_buy_fat
        } else {
            !rand_is_buy_fat
        };

        return open_position(
            &h.exchange_client,
            &h.info_client,
            DefaultPair {
                asset: asset.to_string(),
                sz: Decimal::from_f64(sz * k / 100.0)
                    .unwrap()
                    .round_dp(sz_decimals)
                    .to_f64()
                    .unwrap(),
                reduce_only: false,
                order_type: "FrontendMarket".to_string(),
            },
            h.public_address.clone(),
            is_buy,
        );
    }))
    .await;

    if poss.iter().any(|pos| pos.is_err()) {
        error!(
            "Error opening positions for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & ")
        );

        let _ = close_unit_service(&handlers, asset.clone()).await;

        return Err(format!(
            "Error opening positions for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & ")
        ));
    }

    Ok(())
}

pub async fn close_unit_service(handlers: &Vec<Handlers>, asset: String) -> Result<(), String> {
    warn!(
        "Closing unit for {}, unit: {asset}",
        handlers
            .iter()
            .map(|h| h.public_address.clone())
            .join(" & "),
    );

    let poss = join_all(handlers.iter().enumerate().map(|(_, h)| {
        get_position(&h.info_client, &h.public_address, &asset).map(move |r| (r, h))
    }))
    .await;

    let cps = join_all(poss.iter().map(|(pos, h)| {
        if let Some(pos) = pos.as_ref() {
            return close_position(
                pos,
                &h.exchange_client,
                &h.info_client,
                h.public_address.clone(),
            )
            .boxed();
        } else {
            return future::ready(Ok(())).boxed();
        }
    }))
    .await;

    if cps.iter().any(|cp| cp.is_err()) {
        error!(
            "Error closing unit for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & "),
        );

        return Err(format!(
            "Error closing unit for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & "),
        ));
    }

    Ok(())
}

pub async fn close_and_create_unit_service(
    handlers: &Vec<Handlers>,
    unit: Unit,
) -> Result<(), String> {
    let Unit {
        asset,
        sz,
        leverage,
        sz_decimals,
    } = unit;

    warn!(
        "Invoke ReCreating unit, for {} unit: {}",
        handlers
            .iter()
            .map(|h| h.public_address.clone())
            .join(" & "),
        asset
    );

    let r = close_unit_service(handlers, asset.clone()).await;

    match r {
        Ok(_) => {
            info!(
                "Unit fully closed for {}, unit: {}",
                handlers
                    .iter()
                    .map(|h| h.public_address.clone())
                    .join(" & "),
                asset
            );
            create_unit_service(
                handlers,
                Unit {
                    asset,
                    sz,
                    leverage,
                    sz_decimals,
                },
            )
            .await
        }
        Err(e) => panic!(
            "panic! {e} for {}, unit: {asset}",
            handlers
                .iter()
                .map(|h| h.public_address.clone())
                .join(" & "),
        ),
    }
}

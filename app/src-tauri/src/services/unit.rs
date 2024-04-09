use log::{error, info, warn};

use crate::actions::exchange::{close_position, open_position};
use crate::actions::info::{can_open_position, get_position};
use crate::types::{DefaultPair, Handlers, Unit};

pub async fn create_unit_service(
    handlers_1: &Handlers,
    handlers_2: &Handlers,
    unit: Unit,
) -> Result<(), String> {
    let Unit {
        asset,
        sz,
        leverage,
    } = unit;

    warn!(
        "Creating unit for {}, {} asset: {}",
        handlers_1.public_address, handlers_2.public_address, asset
    );

    let sz = sz * leverage as f64;
    let Handlers {
        info_client: info_client_1,
        exchange_client: exchange_client_1,
        public_address: public_address_1,
    } = handlers_1;

    let Handlers {
        info_client: info_client_2,
        exchange_client: exchange_client_2,
        public_address: public_address_2,
    } = handlers_2;

    let (can_open_1, can_open_2) = tokio::join!(
        can_open_position(&info_client_1, &public_address_1, &asset, sz, leverage),
        can_open_position(&info_client_2, &public_address_2, &asset, sz, leverage)
    );

    if !can_open_1 {
        error!("Cannot open position for {public_address_1}, not enough balance, unit: {asset}");

        return Err(format!(
            "Cannot open position for {public_address_1}, not enough balance, unit: {asset}"
        ));
    }

    if !can_open_2 {
        error!("Cannot open position for {public_address_1}, not enough balance, unit: {asset}");

        return Err(format!(
            "Cannot open position for {public_address_1}, not enough balance, unit: {asset}"
        ));
    }

    let (_, _) = tokio::join!(
        exchange_client_1.update_leverage(leverage, &asset, false, None),
        exchange_client_2.update_leverage(leverage, &asset, false, None)
    );

    let position_pair = DefaultPair {
        asset: asset.to_string(),
        sz,
        reduce_only: false,
        order_type: "FrontendMarket".to_string(),
    };

    let (before_pos_1, before_pos_2) = tokio::join!(
        get_position(&info_client_1, &public_address_1, &asset),
        get_position(&info_client_2, &public_address_2, &asset)
    );

    if before_pos_1.is_some() || before_pos_2.is_some() {
        error!("Unit already exists for {public_address_1}, {public_address_2}, unit: {asset}");

        return Err(format!(
            "Unit already exists for {public_address_1}, {public_address_2}, unit: {asset}"
        ));
    }

    let (pos_1, pos_2) = tokio::join!(
        open_position(
            &exchange_client_1,
            &info_client_1,
            position_pair.clone(),
            public_address_1.clone(),
            true,
        ),
        open_position(
            &exchange_client_2,
            &info_client_2,
            position_pair.clone(),
            public_address_2.clone(),
            false,
        )
    );

    let pos_1 = match pos_1 {
        Ok(f) => f,
        Err(e) => return Err(e),
    };

    let pos_2 = match pos_2 {
        Ok(f) => f,
        Err(e) => return Err(e),
    };

    if pos_1.position.szi.parse::<f64>().unwrap_or(0.0).abs()
        != pos_2.position.szi.parse::<f64>().unwrap_or(0.0).abs()
    {
        error!(
            "Positions for {public_address_1} & {public_address_2} on asset {asset} are not equal"
        );

        close_unit_service(&handlers_1, &handlers_2, asset.clone()).await;

        return Err(format!(
            "Positions for {public_address_1} & {public_address_2} on asset {asset} are not equal"
        ));
    }

    Ok(())

    // open_limit_order(&pos_2, &exchange_client_1, &info_client_1).await;
    // open_limit_order(&pos_1, &exchange_client_2, &info_client_2).await;
}

pub async fn close_unit_service(
    handlers_1: &Handlers,
    handlers_2: &Handlers,
    asset: String,
) -> Result<(), String> {
    warn!(
        "Closing unit for {}, {} asset: {}",
        handlers_1.public_address, handlers_2.public_address, asset
    );

    let Handlers {
        info_client: info_client_1,
        exchange_client: exchange_client_1,
        public_address: public_address_1,
    } = handlers_1;

    let Handlers {
        info_client: info_client_2,
        exchange_client: exchange_client_2,
        public_address: public_address_2,
    } = handlers_2;

    let (pos_1, pos_2) = tokio::join!(
        get_position(&info_client_1, &public_address_1, &asset),
        get_position(&info_client_2, &public_address_2, &asset)
    );

    let (c_1, c_2) = tokio::join!(
        async {
            if let Some(pos) = pos_1 {
                close_position(
                    &pos,
                    &exchange_client_1,
                    &info_client_1,
                    public_address_1.clone(),
                )
                .await
            } else {
                Ok(())
            }
        },
        async {
            if let Some(pos) = pos_2 {
                close_position(
                    &pos,
                    &exchange_client_2,
                    &info_client_2,
                    public_address_2.clone(),
                )
                .await
            } else {
                Ok(())
            }
        }
    );

    if c_1.is_err() || c_2.is_err() {
        error!("Error closing unit for {public_address_1}, {public_address_2}, unit: {asset}");

        return Err(format!(
            "Error closing unit for {public_address_1}, {public_address_2}, unit: {asset}"
        ));
    }

    Ok(())
}

pub async fn close_and_create_unit_service(
    handlers_1: &Handlers,
    handlers_2: &Handlers,
    unit: Unit,
) -> Result<(), String> {
    let Unit {
        asset,
        sz,
        leverage,
    } = unit;

    warn!(
        "Invoke ReCreating unit, for {} & {} unit: {}",
        handlers_1.public_address, handlers_2.public_address, asset
    );

    let r = close_unit_service(handlers_1, handlers_2, asset.clone()).await;

    match r {
        Ok(_) => {
            info!("WTF?");
            create_unit_service(
                handlers_1,
                handlers_2,
                Unit {
                    asset,
                    sz,
                    leverage,
                },
            )
            .await
        }
        Err(e) => panic!(
            "panic! {e} for {}, {}, unit: {asset}",
            handlers_1.public_address, handlers_2.public_address
        ),
    }
}

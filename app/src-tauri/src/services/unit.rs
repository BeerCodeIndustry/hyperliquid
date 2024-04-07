use log::{error, warn};

use crate::actions::exchange::{close_position, open_position};
use crate::actions::info::{can_open_position, get_position};
use crate::types::{DefaultPair, Handlers};

pub async fn create_unit_service(
    handlers_1: &Handlers,
    handlers_2: &Handlers,
    asset: String,
    sz: f64,
    leverage: u32,
) -> Result<(), String> {
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
        can_open_position(&info_client_1, &public_address_1, &asset, sz),
        can_open_position(&info_client_2, &public_address_2, &asset, sz)
    );

    if !can_open_1 {
        error!("Cannot open position for {public_address_1}, not enough balance");

        return Err(format!(
            "Cannot open position for {public_address_1}, not enough balance"
        ));
    }

    if !can_open_2 {
        error!("Cannot open position for {public_address_1}, not enough balance");

        return Err(format!(
            "Cannot open position for {public_address_1}, not enough balance"
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
        error!("Unit already exists for {public_address_1}, {public_address_2}");

        return Err(format!(
            "Unit already exists for {public_address_1}, {public_address_2}"
        ));
    }

    let pos_1 = open_position(
        &exchange_client_1,
        &info_client_1,
        position_pair.clone(),
        public_address_1.clone(),
        true,
    )
    .await;

    if pos_1.is_none() {
        error!("Position not opened for {public_address_1}");

        return Err(format!("Position not opened for {public_address_1}"));
    }

    let pos_2 = open_position(
        &exchange_client_2,
        &info_client_2,
        position_pair.clone(),
        public_address_2.clone(),
        false,
    )
    .await;

    if pos_2.is_none() {
        error!("Position not opened for {public_address_2}");
        close_position(&pos_1.unwrap(), &exchange_client_1, &info_client_1).await;

        return Err(format!("Position not opened for {public_address_2}"));
    }

    let pos_1 = pos_1.unwrap();
    let pos_2 = pos_2.unwrap();

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

    let pos_1 = get_position(&info_client_1, &public_address_1, &asset).await;

    if pos_1.is_some() {
        close_position(&pos_1.unwrap(), &exchange_client_1, &info_client_1).await;
    }

    let pos_2 = get_position(&info_client_2, &public_address_2, &asset).await;

    if pos_2.is_some() {
        close_position(&pos_2.unwrap(), &exchange_client_2, &info_client_2).await;
    }

    Ok(())
}

pub async fn close_and_create_unit_service(
    handlers_1: &Handlers,
    handlers_2: &Handlers,
    asset: String,
    sz: f64,
    leverage: u32,
) -> Result<(), String> {
    warn!("Invoke ReCreating unit");

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

    if pos_1.is_none() && pos_2.is_none() {
        error!("No position to close");

        return Err(format!("No position to close"));
    }

    if pos_1.is_some() && pos_2.is_some() {
        let pos_1 = pos_1.unwrap();
        let pos_2 = pos_2.unwrap();

        tokio::join!(
            close_position(&pos_1, &exchange_client_1, &info_client_1),
            close_position(&pos_2, &exchange_client_2, &info_client_2)
        );
    } else if pos_1.is_some() {
        close_position(&pos_1.unwrap(), &exchange_client_1, &info_client_1).await;
    } else if pos_2.is_some() {
        close_position(&pos_2.unwrap(), &exchange_client_2, &info_client_2).await;
    }

    create_unit_service(&handlers_1, &handlers_2, asset, sz, leverage).await
}

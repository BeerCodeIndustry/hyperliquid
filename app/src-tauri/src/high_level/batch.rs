use futures::future::join_all;
use itertools::Itertools;

use crate::actions::account::get_batch_account_handlers;
use crate::services::unit::{
    close_and_create_unit_service, close_unit_service, create_unit_service,
};
use crate::types::{BatchAccount, Handlers, Unit};
use log::error;

#[tauri::command]
pub async fn create_unit(batch_accounts: Vec<BatchAccount>, unit: Unit) -> Result<(), String> {
    let handlers = join_all(
        batch_accounts
            .clone()
            .into_iter()
            .map(get_batch_account_handlers),
    )
    .await;

    if handlers.iter().any(|h| h.is_err()) {
        error!(
            "Error creating handlers for {}",
            batch_accounts
                .iter()
                .map(|b| b.account.public_address.clone())
                .join(" & "),
        );

        return Err(format!(
            "Error creating handlers for {}",
            batch_accounts
                .iter()
                .map(|b| b.account.public_address.clone())
                .join(" & "),
        ));
    }

    let handlers = handlers.into_iter().map(|h| h.unwrap()).collect();

    create_unit_service(&handlers, unit).await
}

#[tauri::command]
pub async fn close_unit(batch_accounts: Vec<BatchAccount>, asset: String) -> Result<(), String> {
    let handlers = join_all(
        batch_accounts
            .clone()
            .into_iter()
            .map(get_batch_account_handlers),
    )
    .await;

    if handlers.iter().any(|h| h.is_err()) {
        error!(
            "Error creating handlers for {}",
            batch_accounts
                .iter()
                .map(|b| b.account.public_address.clone())
                .join(" & "),
        );

        return Err(format!(
            "Error creating handlers for {}",
            batch_accounts
                .iter()
                .map(|b| b.account.public_address.clone())
                .join(" & "),
        ));
    }

    let handlers = handlers.into_iter().map(|h| h.unwrap()).collect();

    close_unit_service(&handlers, asset).await
}

#[tauri::command]
pub async fn close_and_create_same_unit(
    batch_accounts: Vec<BatchAccount>,
    unit: Unit,
) -> Result<(), String> {
    let handlers = join_all(
        batch_accounts
            .clone()
            .into_iter()
            .map(get_batch_account_handlers),
    )
    .await;

    if handlers.iter().any(|h| h.is_err()) {
        error!(
            "Error creating handlers for {}",
            batch_accounts
                .iter()
                .map(|b| b.account.public_address.clone())
                .join(" & "),
        );

        return Err(format!(
            "Error creating handlers for {}",
            batch_accounts
                .iter()
                .map(|b| b.account.public_address.clone())
                .join(" & "),
        ));
    }

    let handlers = handlers.into_iter().map(|h| h.unwrap()).collect();

    close_and_create_unit_service(&handlers, unit).await
}

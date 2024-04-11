use futures::future::join_all;

use crate::actions::account::get_batch_account_handlers;
use crate::services::unit::{
    close_and_create_unit_service, close_unit_service, create_unit_service,
};
use crate::types::{BatchAccount, Unit};

#[tauri::command]
pub async fn create_unit(batch_accounts: Vec<BatchAccount>, unit: Unit) -> Result<(), String> {
    let handlers = join_all(batch_accounts.into_iter().map(get_batch_account_handlers)).await;

    create_unit_service(&handlers, unit).await
}

#[tauri::command]
pub async fn close_unit(batch_accounts: Vec<BatchAccount>, asset: String) -> Result<(), String> {
    let handlers = join_all(batch_accounts.into_iter().map(get_batch_account_handlers)).await;

    close_unit_service(&handlers, asset).await
}

#[tauri::command]
pub async fn close_and_create_same_unit(
    batch_accounts: Vec<BatchAccount>,
    unit: Unit,
) -> Result<(), String> {
    let handlers = join_all(batch_accounts.into_iter().map(get_batch_account_handlers)).await;

    close_and_create_unit_service(&handlers, unit).await
}

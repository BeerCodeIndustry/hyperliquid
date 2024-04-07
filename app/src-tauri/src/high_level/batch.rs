use crate::actions::account::get_batch_account_handlers;
use crate::services::unit::{
    close_and_create_unit_service, close_unit_service, create_unit_service,
};
use crate::types::BatchAccount;

#[tauri::command]
pub async fn create_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    asset: String,
    sz: f64,
    leverage: u32,
) {
    let (handlers_1, handlers_2) = tokio::join!(
        get_batch_account_handlers(account1.clone()),
        get_batch_account_handlers(account2.clone())
    );

    create_unit_service(&handlers_1, &handlers_2, asset, sz, leverage).await;
}

#[tauri::command]
pub async fn close_unit(account1: BatchAccount, account2: BatchAccount, asset: String) {
    let (handlers_1, handlers_2) = tokio::join!(
        get_batch_account_handlers(account1.clone()),
        get_batch_account_handlers(account2.clone())
    );

    close_unit_service(&handlers_1, &handlers_2, asset).await;
}

#[tauri::command]
pub async fn close_and_create_same_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    asset: String,
    sz: f64,
    leverage: u32,
) {
    let (handlers_1, handlers_2) = tokio::join!(
        get_batch_account_handlers(account1.clone()),
        get_batch_account_handlers(account2.clone())
    );

    close_and_create_unit_service(&handlers_1, &handlers_2, asset, sz, leverage).await;
}

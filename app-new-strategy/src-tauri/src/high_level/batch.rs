use crate::actions::account::get_batch_account_handlers;
use crate::services::unit::{
    close_and_create_unit_service, close_unit_service, create_unit_service,
};
use crate::types::{BatchAccount, Unit};

#[tauri::command]
pub async fn create_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    account3: BatchAccount,
    account4: BatchAccount,
    unit: Unit,
) -> Result<(), String> {
    let (handlers_1, handlers_2, handlers_3, handlers_4) = tokio::join!(
        get_batch_account_handlers(account1.clone()),
        get_batch_account_handlers(account2.clone()),
        get_batch_account_handlers(account3.clone()),
        get_batch_account_handlers(account4.clone()),
    );

    create_unit_service(&handlers_1, &handlers_2, &handlers_3, &handlers_4, unit).await
}

#[tauri::command]
pub async fn close_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    account3: BatchAccount,
    account4: BatchAccount,
    asset: String,
) -> Result<(), String> {
    let (handlers_1, handlers_2, handlers_3, handlers_4) = tokio::join!(
        get_batch_account_handlers(account1.clone()),
        get_batch_account_handlers(account2.clone()),
        get_batch_account_handlers(account3.clone()),
        get_batch_account_handlers(account4.clone()),
    );

    close_unit_service(&handlers_1, &handlers_2, &handlers_3, &handlers_4, asset).await
}

#[tauri::command]
pub async fn close_and_create_same_unit(
    account1: BatchAccount,
    account2: BatchAccount,
    account3: BatchAccount,
    account4: BatchAccount,
    unit: Unit,
) -> Result<(), String> {
    let (handlers_1, handlers_2, handlers_3, handlers_4) = tokio::join!(
        get_batch_account_handlers(account1.clone()),
        get_batch_account_handlers(account2.clone()),
        get_batch_account_handlers(account3.clone()),
        get_batch_account_handlers(account4.clone()),
    );

    close_and_create_unit_service(&handlers_1, &handlers_2, &handlers_3, &handlers_4, unit).await
}

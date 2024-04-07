use crate::actions::account::{get_account, get_info_client};
use crate::types::BatchAccount;

#[tauri::command]
pub async fn get_asset_price(batch_account: BatchAccount, asset: String) -> String {
    let account = get_account(batch_account);
    let info_client = get_info_client(&account).await;

    let all_mids = info_client.all_mids().await.unwrap();

    all_mids[&asset].to_string()
}

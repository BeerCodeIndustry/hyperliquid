use crate::actions::account::{get_account, get_info_client};
use crate::types::BatchAccount;

#[tauri::command]
pub async fn get_asset_price(batch_account: BatchAccount, asset: String) -> String {
    let account = get_account(batch_account).unwrap();
    let info_client = get_info_client(&account).await.unwrap();

    let all_mids = info_client.all_mids().await.unwrap();

    all_mids[&asset].to_string()
}

#[tauri::command]
pub async fn get_asset_sz_decimals(
    batch_account: BatchAccount,
    asset: String,
) -> Result<u32, String> {
    let account = get_account(batch_account).unwrap();
    let info_client = get_info_client(&account).await.unwrap();

    let all_sz = info_client.meta().await.unwrap().universe;

    match all_sz.into_iter().find(|s| s.name == asset) {
        Some(s) => Ok(s.sz_decimals),
        None => Err("Cannot find asset".to_string()),
    }
}

use crate::actions::account::{get_account, get_info_client};
use crate::actions::info::get_user_state;
use crate::types::BatchAccount;

#[tauri::command]
pub async fn get_unit_user_states(account1: BatchAccount, account2: BatchAccount) {
    let account_1 = get_account(account1);
    let account_2 = get_account(account2);

    let info_client_1 = get_info_client(&account_1).await;
    let info_client_2 = get_info_client(&account_2).await;

    let user_state_1 = get_user_state(&info_client_1, &account_1.public_address).await;
    let user_state_2 = get_user_state(&info_client_2, &account_2.public_address).await;

    // serde_json::to_string(&[user_state_1, user_state_2]).unwrap()
}

use crate::actions::account::{get_account, get_info_client};
use crate::actions::info::get_user_state;
use crate::dto_types::user_state::UserState;
use crate::types::BatchAccount;
use crate::utils::convert_types::convert_user_state;

#[tauri::command]
pub async fn get_unit_user_states(
    account1: BatchAccount,
    account2: BatchAccount,
    account3: BatchAccount,
    account4: BatchAccount,
) -> Result<[UserState; 4], String> {
    let account_1 = get_account(account1);
    let account_2 = get_account(account2);
    let account_3 = get_account(account3);
    let account_4 = get_account(account4);

    let (info_client_1, info_client_2, info_client_3, info_client_4) = tokio::join!(
        get_info_client(&account_1),
        get_info_client(&account_2),
        get_info_client(&account_3),
        get_info_client(&account_4)
    );

    let (user_state_1, user_state_2, user_state_3, user_state_4) = tokio::join!(
        get_user_state(&info_client_1, &account_1.public_address),
        get_user_state(&info_client_2, &account_2.public_address),
        get_user_state(&info_client_3, &account_4.public_address),
        get_user_state(&info_client_3, &account_4.public_address),
    );

    Ok([
        convert_user_state(user_state_1),
        convert_user_state(user_state_2),
        convert_user_state(user_state_3),
        convert_user_state(user_state_4),
    ])
}

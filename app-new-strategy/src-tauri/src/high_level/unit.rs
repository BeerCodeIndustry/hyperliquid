use futures::future::{join_all, FutureExt};

use crate::actions::account::{get_account, get_info_client};
use crate::actions::info::get_user_state;
use crate::dto_types::user_state::UserState;
use crate::types::{Account, BatchAccount};
use crate::utils::convert_types::convert_user_state;

#[tauri::command]
pub async fn get_unit_user_states(accounts: Vec<BatchAccount>) -> Result<Vec<UserState>, String> {
    let accounts: Vec<_> = accounts.iter().map(|a| get_account(a.clone())).collect();

    if accounts.iter().any(|a| a.is_err()) {
        return Err(format!("Error getting accounts"));
    }

    let accounts: Vec<_> = accounts.into_iter().map(|a| a.unwrap()).collect();

    let info_clients = join_all(
        accounts
            .iter()
            .map(|a| get_info_client(a).map(move |r| (r, a))),
    )
    .await;

    if info_clients.iter().any(|(r, a)| r.is_err()) {
        return Err(format!("Error getting info accounts"));
    }

    let info_clients: Vec<_> = info_clients
        .into_iter()
        .map(|(r, a)| (r.unwrap(), a))
        .collect();

    let user_states = join_all(info_clients.iter().map(|(info_client, account)| {
        get_user_state(info_client, &account.public_address).map(|r| convert_user_state(r))
    }))
    .await;

    Ok(user_states)
}

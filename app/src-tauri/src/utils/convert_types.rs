use ethers::types::H160;
use hyperliquid_rust_sdk::UserStateResponse;
use std::str::FromStr;

use crate::dto_types::user_state::{
    AssetPosition, Leverage, MarginSummary, PositionData, UserState,
};

pub fn convert_user_state(user_state: UserStateResponse) -> UserState {
    UserState {
        asset_positions: user_state
            .asset_positions
            .into_iter()
            .map(|pos| AssetPosition {
                position: PositionData {
                    coin: pos.position.coin,
                    entry_px: pos.position.entry_px,
                    leverage: Leverage {
                        type_string: pos.position.leverage.type_string,
                        value: pos.position.leverage.value,
                        raw_usd: pos.position.leverage.raw_usd,
                    },
                    liquidation_px: pos.position.liquidation_px,
                    margin_used: pos.position.margin_used,
                    position_value: pos.position.position_value,
                    return_on_equity: pos.position.return_on_equity,
                    szi: pos.position.szi,
                    unrealized_pnl: pos.position.unrealized_pnl,
                },
                type_string: pos.type_string,
            })
            .collect(),
        cross_margin_summary: MarginSummary {
            account_value: user_state.cross_margin_summary.account_value,
            total_margin_used: user_state.cross_margin_summary.total_margin_used,
            total_ntl_pos: user_state.cross_margin_summary.total_ntl_pos,
            total_raw_usd: user_state.cross_margin_summary.total_raw_usd,
        },
        margin_summary: MarginSummary {
            account_value: user_state.margin_summary.account_value,
            total_margin_used: user_state.margin_summary.total_margin_used,
            total_ntl_pos: user_state.margin_summary.total_ntl_pos,
            total_raw_usd: user_state.margin_summary.total_raw_usd,
        },
        withdrawable: user_state.withdrawable,
    }
}

pub fn convert_public_address(public_address: &str) -> H160 {
    let user: String = public_address.parse().unwrap();
    
    H160::from_str(&user).unwrap()
}
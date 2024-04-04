use hyperliquid_rust_sdk::AssetPosition;

pub fn parse_liq_pos(pos: &AssetPosition) -> f64 {
    pos.position
        .liquidation_px
        .clone()
        .unwrap()
        .parse::<f64>()
        .unwrap()
}

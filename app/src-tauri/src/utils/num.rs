use itertools::Itertools;

use rust_decimal::prelude::*;

use log::info;

pub fn next_decimal(num: f64, is_buy: bool) -> f64 {
    let rnum = round_num_by_hyper_liquid(num).to_string();
    let dot_idx = rnum.find(".").unwrap();
    let diff = if is_buy { -1 } else { 1 };
    let first_digit_idx = rnum.find(|c: char| c != '0' && c != '.').unwrap();
    let new_num = (rnum.replace(".", "").parse::<i32>().unwrap() + diff).to_string();

    info!("first_digit_idx: {first_digit_idx}");

    if first_digit_idx == 0 {
        return format!("{}{}{}", &new_num[..dot_idx], ".", &new_num[dot_idx..])
            .parse::<f64>()
            .unwrap();
    }

    return format!("0.{}{}", "0".repeat(first_digit_idx - 2), &new_num,)
        .parse::<f64>()
        .unwrap();
}

pub fn round_num_by_hyper_liquid(num: f64) -> f64 {
    let string_num = num.to_string();
    // starts with 0 => 5 or 6 after dot
    // starts with 0 after dot => 6 after dot
    // start with >0 => 5 in whole number
    let mut round_to: u32 = 0;

    if string_num.starts_with("0.") {
        round_to = if string_num.starts_with("0.0") { 6 } else { 5 };
    } else {
        round_to = 5 - (num.log10().floor() as u32 + 1)
    }

    Decimal::from_f64(num)
        .unwrap()
        .round_dp(round_to)
        .to_f64()
        .unwrap()
}

use itertools::Itertools;

pub fn next_decimal(num: f64, is_buy: bool, asset_sz_decimals: u32) -> f64 {
    let rnum = round_to_n(num, asset_sz_decimals).to_string();

    rnum.split("")
        .into_iter()
        .enumerate()
        .map(|(i, ch)| {
            if i == rnum.len() {
                if is_buy {
                    (ch.parse::<i8>().unwrap() - 1).to_string()
                } else {
                    (ch.parse::<i8>().unwrap() + 1).to_string()
                }
            } else {
                ch.to_string()
            }
        })
        .join("")
        .parse::<f64>()
        .unwrap()
}

pub fn round_to_n(num: f64, sz_decimals: u32) -> f64 {
    let default_round_n: usize = if sz_decimals == 0 { 7 } else { 5 };

    let ncount = num.to_string().len() - 1; // without dot
    if default_round_n >= ncount {
        return num;
    }
    let num_chars: Vec<_> = num.to_string().chars().collect();

    num_chars[0..(default_round_n + 1)]
        .into_iter()
        .enumerate()
        .map(|(i, ch)| {
            if i == default_round_n {
                if num_chars[i + 1].to_string().parse::<i8>().unwrap() >= 5 {
                    (ch.to_string().parse::<i8>().unwrap() + 1).to_string()
                } else {
                    ch.to_string()
                }
            } else {
                ch.to_string()
            }
        })
        .join("")
        .parse::<f64>()
        .unwrap()
}

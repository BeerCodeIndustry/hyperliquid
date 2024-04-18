use crate::types::RandK;
use rand::Rng;

pub fn get_rand_k_4() -> Vec<RandK> {
    let mut rng = rand::thread_rng();
    rng.gen_range(10..11);
    let min_k = 20;
    let mut acc = 100;

    let k_1 = 100;
    let k_2 = rng.gen_range(min_k..acc - min_k * 2);
    acc -= k_2;
    let k_3 = rng.gen_range(min_k..acc - min_k + 1);
    let k_4 = acc - k_3;

    let ks = vec![
        RandK {
            k: k_1,
            is_fat: true,
        },
        RandK {
            k: k_2,
            is_fat: false,
        },
        RandK {
            k: k_3,
            is_fat: false,
        },
        RandK {
            k: k_4,
            is_fat: false,
        },
    ];

    ks
    // rand_idx_4(ks)
}

pub fn get_rand_k_6() -> Vec<RandK> {
    let mut rng = rand::thread_rng();
    let min_k = 20;
    let mut acc = 100;

    let k_1 = rng.gen_range(40..61); // fat
    let k_2 = 100 - k_1; // fat
    let k_3 = rng.gen_range(min_k..acc - min_k * 3);
    acc -= k_3;
    let k_4 = rng.gen_range(min_k..acc - min_k * 2);
    acc -= k_4;
    let k_5 = rng.gen_range(min_k..acc - min_k);
    let k_6 = acc - k_5;

    let ks = vec![
        RandK {
            k: k_1,
            is_fat: true,
        },
        RandK {
            k: k_2,
            is_fat: true,
        },
        RandK {
            k: k_3,
            is_fat: false,
        },
        RandK {
            k: k_4,
            is_fat: false,
        },
        RandK {
            k: k_5,
            is_fat: false,
        },
        RandK {
            k: k_6,
            is_fat: false,
        },
    ];

    ks
    // rand_idx_6(ks)
}

pub fn get_rand_is_buy_fat() -> bool {
    let mut rng = rand::thread_rng();

    rng.gen_bool(0.5)
}

pub fn rand_idx_4(ks: Vec<RandK>) -> Vec<RandK> {
    let mut ks = ks.clone();
    let mut rng = rand::thread_rng();
    let mut ks_4: Vec<RandK> = vec![];
    let i_1 = rng.gen_range(0..4);
    ks_4.push(ks[i_1]);
    ks.remove(i_1);

    let i_2 = rng.gen_range(0..3);
    ks_4.push(ks[i_2]);
    ks.remove(i_2);

    let i_3 = rng.gen_range(0..2);
    ks_4.push(ks[i_3]);
    ks.remove(i_3);

    ks_4.push(ks[0]);

    ks_4
}

pub fn rand_idx_6(ks: Vec<RandK>) -> Vec<RandK> {
    let mut rng = rand::thread_rng();
    let mut ks = ks.clone();
    let mut ks_6: Vec<RandK> = vec![];

    let i_1 = rng.gen_range(0..6);
    ks_6.push(ks[i_1]);
    ks.remove(i_1);

    let i_2 = rng.gen_range(0..5);
    ks_6.push(ks[i_2]);
    ks.remove(i_2);

    let i_3 = rng.gen_range(0..4);
    ks_6.push(ks[i_3]);
    ks.remove(i_3);

    let i_4 = rng.gen_range(0..3);
    ks_6.push(ks[i_4]);
    ks.remove(i_4);

    let i_5 = rng.gen_range(0..2);
    ks_6.push(ks[i_5]);
    ks.remove(i_5);

    ks_6.push(ks[0]);

    ks_6
}

pub fn rand_idx(ks: Vec<RandK>) -> Vec<RandK> {
    if ks.len() == 4 {
        rand_idx_4(ks)
    } else {
        rand_idx_6(ks)
    }
}

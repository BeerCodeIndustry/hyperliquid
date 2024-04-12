use rand::Rng;

pub fn get_rand_k_4() -> Vec<i32> {
    let mut rng = rand::thread_rng();
    rng.gen_range(10..11);
    let min_k = 10;
    let mut acc = 100;

    let k_1 = 100;
    let k_2 = rng.gen_range(min_k..acc - min_k * 2);
    acc -= k_2;
    let k_3 = rng.gen_range(min_k..acc - min_k + 1);
    let k_4 = acc - k_3;

    let ks = vec![k_1, k_2, k_3, k_4];

    rand_idx_4(ks)
}

pub fn get_rand_k_6() -> Vec<i32> {
    let mut rng = rand::thread_rng();
    let min_k = 10;
    let mut acc = 200;

    let k_1 = 100;
    let k_2 = 100;
    let k_3 = rng.gen_range(min_k..acc - min_k * 3);
    acc -= k_3;
    let k_4 = rng.gen_range(min_k..acc - min_k * 2);
    acc -= k_4;
    let k_5 = rng.gen_range(min_k..acc - min_k);
    let k_6 = acc - k_5;

    let ks = vec![k_1, k_2, k_3, k_4, k_5, k_6];

    rand_idx_6(ks)
}

pub fn get_rand_is_buy_fat() -> bool {
    let mut rng = rand::thread_rng();

    rng.gen_bool(0.5)
}

pub fn rand_idx_4(ks: Vec<i32>) -> Vec<i32> {
    let mut ks = ks.clone();
    let mut rng = rand::thread_rng();
    let mut ks_4: Vec<i32> = vec![0, 0, 0, 0];
    let i_1 = rng.gen_range(0..4);
    ks_4[0] = ks[i_1];
    ks.remove(i_1);

    let i_2 = rng.gen_range(0..3);
    ks_4[1] = ks[i_2];
    ks.remove(i_2);

    let i_3 = rng.gen_range(0..2);
    ks_4[2] = ks[i_3];
    ks.remove(i_3);

    ks_4[3] = ks[0];

    ks_4
}

pub fn rand_idx_6(ks: Vec<i32>) -> Vec<i32> {
    let mut rng = rand::thread_rng();
    let mut ks = ks.clone();
    let mut ks_6: Vec<i32> = vec![0, 0, 0, 0, 0, 0];

    let i_1 = rng.gen_range(0..6);
    ks_6[0] = ks[i_1];
    ks.remove(i_1);

    let i_2 = rng.gen_range(0..5);
    ks_6[1] = ks[i_2];
    ks.remove(i_2);

    let i_3 = rng.gen_range(0..4);
    ks_6[2] = ks[i_3];
    ks.remove(i_3);

    let i_4 = rng.gen_range(0..3);
    ks_6[3] = ks[i_4];
    ks.remove(i_4);

    let i_5 = rng.gen_range(0..2);
    ks_6[4] = ks[i_5];
    ks.remove(i_5);

    ks_6[5] = ks[0];

    ks_6
}

use log::SetLoggerError;
use reqwest::Proxy;

mod actions;
mod high_level;
mod types;
mod utils;

use high_level::batch::create_batch;

use types::Account;

#[tokio::main]
async fn main() -> Result<(), SetLoggerError> {
    dotenv::dotenv().ok();
    env_logger::init();

    let proxy_1 = Proxy::all("89.40.223.107:6143")
        .unwrap()
        .basic_auth("gljdskgd", "7qrarsn88jhk");
    let proxy_2 = Proxy::all("89.40.222.208:6584")
        .unwrap()
        .basic_auth("gljdskgd", "7qrarsn88jhk");

    create_batch(
        Account {
            public_address: "0xD14cf2c66f50845222C80a3d4910CdF147701B73".to_string(),
            private_api_key: "5d57f4591004358204c42a30c269d146f10d1b5c568129c406ff3ccfc5592b63"
                .to_string(),
            proxy: proxy_1.clone(),
        },
        Account {
            public_address: "0x19E2F720Cb47C3B6d14a5d6D800707e8DD72493f".to_string(),
            private_api_key: "5dc580da116d1d9654d0cf3c5363a039d199bf730fd391f5936fe72577562fae"
                .to_string(),
            proxy: proxy_2.clone(),
        },
        "SUSHI",
        10.0, // basic amount of tokens
        10,   // leverage
    )
    .await;

    Ok(())
}

use log::info;
use std::collections::HashMap;
use std::fs::File;
use std::fs::OpenOptions;
use std::io::BufRead;
use std::io::{BufReader, Write};

use crate::types::{FileAccount, FileProxy};

#[tauri::command]
pub fn add_account(data: &str) {
    let data = format!("{}\n", data);
    let path = "local_db/accounts.txt";
    let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open(path)
        .unwrap();
    file.write_all(data.as_bytes()).unwrap();
    info!("Account added: {}", data);
}

#[tauri::command]
pub fn parse_accounts() -> Vec<FileAccount> {
    let path = "local_db/accounts.txt";
    let file = File::open(path);
    let mut accounts = vec![];

    if file.is_err() {
        return accounts;
    }

    let reader = BufReader::new(file.unwrap());

    for line_result in reader.lines() {
        if line_result.is_err() {
            continue;
        }

        let line = line_result.unwrap();
        let line_vec: Vec<_> = line.split("//").collect();

        if line_vec.len() == 3 {
            let name = line_vec[0].to_string();
            let public_address = line_vec[1].to_string();
            let api_private_key = line_vec[2].to_string();

            accounts.push(FileAccount {
                name,
                public_address,
                api_private_key,
            });
        }
    }

    accounts
}

#[tauri::command]
pub fn add_proxy(data: &str) {
    let data = format!("{}\n", data);
    let path = "local_db/proxy.txt";
    let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open(path)
        .unwrap();
    file.write_all(data.as_bytes()).unwrap();
    info!("Proxy added: {}", data);
}

#[tauri::command]
pub fn parse_proxy() -> Vec<FileProxy> {
    let path = "local_db/proxy.txt";
    let file = File::open(path);
    let mut proxies = vec![];

    if file.is_err() {
        return proxies;
    }

    let reader = BufReader::new(file.unwrap());

    for line_result in reader.lines() {
        if line_result.is_err() {
            continue;
        }

        let line = line_result.unwrap();
        let line_vec: Vec<_> = line.split(":").collect();

        if line_vec.len() == 5 {
            let name = line_vec[0].to_string();
            let ip = line_vec[1].to_string();
            let port = line_vec[2].to_string();
            let login = line_vec[3].to_string();
            let pass = line_vec[4].to_string();

            proxies.push(FileProxy {
                name,
                ip,
                port,
                login,
                pass,
            });
        }
    }

    proxies
}

#[tauri::command]
pub fn link_account_proxy(data: &str) {
    let data = format!("{}\n", data);
    let path = "local_db/account_proxy.txt";
    let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open(path)
        .unwrap();
    file.write_all(data.as_bytes()).unwrap();
    info!("Link Account-Proxy: {}", data);
}

#[tauri::command]
pub fn parse_account_proxy() -> HashMap<String, String> {
    let path = "local_db/account_proxy.txt";
    let file = File::open(path);
    let mut accounts_proxy: HashMap<String, String> = HashMap::new();

    if file.is_err() {
        return accounts_proxy;
    }

    let reader = BufReader::new(file.unwrap());

    for line_result in reader.lines() {
        if line_result.is_err() {
            continue;
        }

        let line = line_result.unwrap();
        let line_vec: Vec<_> = line.split("//").collect();

        if line_vec.len() == 2 {
            let public_address = line_vec[0].to_string();
            let proxy = line_vec[1].to_string();

            accounts_proxy.insert(public_address, proxy);
        }
    }

    accounts_proxy
}

#[tauri::command]
pub fn unlink_account_proxy(data: &str) {
    // TODO
    // let path = "account_proxy.txt";
    // let file = File::open(path);

    // if file.is_err() {
    //     return;
    // }

    // let reader = BufReader::new(file.unwrap());
    // let mut lines = vec![];
}

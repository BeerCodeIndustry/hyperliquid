use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

#[tauri::command]
pub fn get_logs() -> Vec<String> {
    let path = Path::new("logs.log");

    let file = match File::open(&path) {
        Ok(file) => file,
        Err(_) => return Vec::new(),
    };
    let reader = BufReader::new(file);

    reader.lines().filter_map(Result::ok).collect()
}

#[tauri::command]
pub fn clear_logs(rows: Vec<String>) -> Result<(), String> {
    let path = Path::new("logs.log");

    let _file = match File::create(path) {
        Ok(_) => return Ok(()),
        Err(_) => return Err("Error clearing file".to_string()),
    };
}

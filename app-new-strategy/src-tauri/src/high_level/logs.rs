use std::fs::File;
use std::io::{BufRead, BufReader, Write};
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
    let file = match File::open("logs.log") {
        Ok(file) => file,
        Err(_) => return Err("Error opening file".to_string()),
    };

    let reader = BufReader::new(file);
    let mut lines: Vec<String> = reader.lines().filter_map(Result::ok).collect();

    lines.retain(|line| !rows.contains(line));

    let mut file = File::create("logs.log").unwrap();
    for line in lines {
        match writeln!(file, "{}", line) {
            Ok(_) => {}
            Err(_) => return Err("Error writing to file".to_string()),
        };
    }

    Ok(())
}

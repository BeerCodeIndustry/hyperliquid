use std::fs::{File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::Path;

#[tauri::command]
pub fn get_logs() -> Vec<String> {
    let path = Path::new("logs.log");
    // Открывает файл для чтения.
    let file = match File::open(&path) {
        Ok(file) => file,
        Err(_) => return Vec::new(), // В случае ошибки возвращаем пустой вектор.
    };
    let reader = BufReader::new(file);
    // Читаем все строки, затем выбираем последние 100.
    let lines: Vec<String> = reader.lines().filter_map(Result::ok).collect();
    let len = lines.len();
    let last_100_lines = if len > 100 {
        &lines[len - 100..]
    } else {
        &lines[..]
    };

    // Перезаписываем файл последними 100 строками.
    let mut file = match OpenOptions::new().write(true).truncate(true).open(&path) {
        Ok(file) => file,
        Err(_) => return Vec::new(), // В случае ошибки возвращаем пустой вектор.
    };
    for line in last_100_lines {
        if let Err(_) = writeln!(file, "{}", line) {
            // В случае ошибки записи прерываем цикл.
            break;
        }
    }

    last_100_lines.to_vec()
}

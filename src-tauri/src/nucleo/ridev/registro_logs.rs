// src-tauri/src/nucleo/ridev/registro_logs.rs
// Registro de eventos estructurados en un archivo log rotativo local (doctorii.log)
use std::fs::{OpenOptions, File};
use std::io::{Write, BufRead, BufReader};
use std::path::Path;

const LOG_FILE_PATH: &str = crate::rii::RUTA_LOGS;

pub fn escribir_log(nivel: &str, mensaje: &str) -> Result<(), String> {
    let timestamp = match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
        Ok(n) => n.as_secs(),
        Err(_) => 0,
    };
    
    let log_line = format!(
        "[Epoch:{}] [{}] {}\n",
        timestamp,
        nivel.to_uppercase(),
        mensaje
    );
    
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .append(true)
        .open(LOG_FILE_PATH)
        .map_err(|e| e.to_string())?;
        
    file.write_all(log_line.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn leer_logs(limite_lineas: usize) -> Result<String, String> {
    let path = Path::new(LOG_FILE_PATH);
    if !path.exists() {
        return Ok("El archivo de log no existe aún. Dispara un log de prueba primero.".to_string());
    }
    
    let file = File::open(LOG_FILE_PATH).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    let lineas: Vec<String> = reader.lines().flatten().collect();
    
    let start = if lineas.len() > limite_lineas {
        lineas.len() - limite_lineas
    } else {
        0
    };
    
    Ok(lineas[start..].join("\n"))
}

pub fn borrar_logs() -> Result<(), String> {
    let path = Path::new(LOG_FILE_PATH);
    if path.exists() {
        std::fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

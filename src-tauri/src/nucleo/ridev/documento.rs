// src-tauri/src/nucleo/ridev/documento.rs
// Lector genérico de archivos de texto plano (.txt, .json, .csv) de exámenes clínicos
use std::fs;
use std::path::Path;

pub fn leer_archivo_texto(ruta_str: &str) -> Result<String, String> {
    let path = Path::new(ruta_str);
    if !path.exists() {
        return Err(format!("El archivo en la ruta '{}' no existe.", ruta_str));
    }

    if !path.is_file() {
        return Err("La ruta seleccionada no corresponde a un archivo válido.".to_string());
    }

    // Validación de seguridad de extensión
    let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");
    if extension != "txt" && extension != "json" && extension != "csv" {
        return Err("Formato no soportado. Solo se permiten archivos .txt, .json o .csv.".to_string());
    }

    // Validación de seguridad de peso (máximo 1 MB)
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > crate::rii::DOCUMENTO_PESO_MAX_BYTES {
        return Err("El archivo excede el tamaño máximo permitido configurado en el backend.".to_string());
    }

    let contenido = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(contenido)
}

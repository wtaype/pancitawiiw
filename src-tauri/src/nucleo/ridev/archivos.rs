// src-tauri/src/nucleo/ridev/archivos.rs
// Utilidades nativas puras para manipulación de archivos y metadatos

use std::fs;
use std::path::{Path, PathBuf};

/// Guarda un archivo de texto en una ruta y nombre específicos
#[tauri::command]
pub fn escribir_archivo_texto_comando(ruta: String, nombre: String, contenido: String) -> Result<(), String> {
    let mut path = PathBuf::from(ruta);
    path.push(nombre);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::write(&path, contenido).map_err(|e| format!("Error al escribir el archivo: {}", e))?;
    Ok(())
}

/// Lee el contenido de un archivo de texto plano con controles de seguridad
#[tauri::command]
pub fn leer_archivo_texto_comando(ruta: String) -> Result<String, String> {
    let path = Path::new(&ruta);
    if !path.exists() {
        return Err(format!("El archivo en la ruta '{}' no existe.", ruta));
    }

    if !path.is_file() {
        return Err("La ruta seleccionada no corresponde a un archivo válido.".to_string());
    }

    // Validación de seguridad de extensión
    let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");
    if extension != "txt" && extension != "json" && extension != "csv" && extension != "md" {
        return Err("Formato no soportado. Solo se permiten archivos .txt, .json, .csv o .md.".to_string());
    }

    // Validación de seguridad de peso (máximo 1 MB)
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > crate::rii::DOCUMENTO_PESO_MAX_BYTES {
        return Err("El archivo excede el tamaño máximo permitido configurado en el backend.".to_string());
    }

    let contenido = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(contenido)
}

/// Elimina archivos en una carpeta que coincidan con una extensión dada de forma recursiva
pub fn eliminar_archivos_por_patron(carpeta: &str, extension: &str) -> Result<u64, String> {
    let path = Path::new(carpeta);
    if !path.exists() {
        return Ok(0);
    }
    let mut contador = 0;
    eliminar_recursivo(path, extension, &mut contador);
    Ok(contador)
}

fn eliminar_recursivo(path: &Path, extension: &str, contador: &mut u64) {
    if path.is_dir() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    eliminar_recursivo(&p, extension, contador);
                } else if p.extension().map_or(false, |ext| ext == extension) {
                    if fs::remove_file(p).is_ok() {
                        *contador += 1;
                    }
                }
            }
        }
    }
}

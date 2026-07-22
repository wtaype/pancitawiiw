// src-tauri/src/nucleo/ridev/carpetas.rs
// Utilidades nativas puras para manipulación, selección y cálculo de directorios

use std::fs;
use std::path::Path;

/// Diálogo nativo para seleccionar una carpeta del sistema de forma asíncrona
#[tauri::command]
pub async fn seleccionar_carpeta_comando(titulo: String) -> Result<Option<String>, String> {
    let folder = rfd::AsyncFileDialog::new()
        .set_title(&titulo)
        .pick_folder()
        .await;

    if let Some(folder_handle) = folder {
        let folder_path = folder_handle.path();
        Ok(Some(folder_path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

/// Calcula el tamaño total de un directorio de forma recursiva
pub fn calcular_tamano_directorio(ruta: &str) -> Result<u64, String> {
    let path = Path::new(ruta);
    if !path.exists() {
        return Err(format!("El directorio no existe: {}", ruta));
    }
    Ok(calcular_recursivo(path))
}

fn calcular_recursivo(path: &Path) -> u64 {
    let mut total = 0;
    if path.is_dir() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    total += calcular_recursivo(&p);
                } else if let Ok(meta) = entry.metadata() {
                    total += meta.len();
                }
            }
        }
    } else if let Ok(meta) = path.metadata() {
        total = meta.len();
    }
    total
}

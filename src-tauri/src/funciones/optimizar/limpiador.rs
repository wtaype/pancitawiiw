// src-tauri/src/funciones/optimizar/limpiador.rs
// Módulo de ejecución paralela multihilo Rayon (Suma solo bytes de archivos REALMENTE eliminados)

use std::fs;
use std::path::Path;
use rayon::prelude::*;

/// Comando Tauri para eliminar en paralelo las rutas de archivos seleccionadas (Solo suma bytes eliminados con éxito)
#[tauri::command]
pub async fn optimizar_ejecutar_limpieza(rutas: Vec<String>) -> Result<u64, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let bytes_liberados: u64 = rutas.par_iter().map(|ruta_str| {
            let p = Path::new(ruta_str);
            if let Ok(meta) = fs::metadata(p) {
                let len = meta.len();
                if p.is_file() {
                    if fs::remove_file(p).is_ok() {
                        len
                    } else {
                        0 // Si Windows tiene el archivo bloqueado por un proceso activo, no se suma
                    }
                } else if p.is_dir() {
                    if fs::remove_dir_all(p).is_ok() {
                        len
                    } else {
                        0
                    }
                } else {
                    0
                }
            } else {
                0
            }
        }).sum();

        Ok(bytes_liberados)
    })
    .await
    .map_err(|e| format!("Error al ejecutar la limpieza: {}", e))?
}

pub fn calcular_tamano_dir_detallado(dir: &Path) -> (u64, Vec<String>, Vec<super::modelos::DetalleArchivoBasura>) {
    use super::modelos::DetalleArchivoBasura;
    use std::time::UNIX_EPOCH;

    let mut total_bytes = 0;
    let mut lista_rutas = Vec::new();
    let mut lista_archivos = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    let len = meta.len();
                    total_bytes += len;
                    let ruta_str = path.to_string_lossy().to_string();
                    let nombre_str = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                    
                    let fecha_mod = meta.modified()
                        .ok()
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    lista_rutas.push(ruta_str.clone());
                    
                    if lista_archivos.len() < 100 {
                        lista_archivos.push(DetalleArchivoBasura {
                            nombre: nombre_str,
                            ruta: ruta_str,
                            tamano_bytes: len,
                            fecha_modificacion: fecha_mod,
                        });
                    }
                } else if meta.is_dir() {
                    let (sub_bytes, sub_rutas, sub_archs) = calcular_tamano_dir_detallado(&path);
                    total_bytes += sub_bytes;
                    lista_rutas.extend(sub_rutas);
                    if lista_archivos.len() < 100 {
                        lista_archivos.extend(sub_archs.into_iter().take(100 - lista_archivos.len()));
                    }
                }
            }
        }
    }

    (total_bytes, lista_rutas, lista_archivos)
}

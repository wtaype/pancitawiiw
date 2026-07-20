// src-tauri/src/nucleo/ridev/archivos.rs
// Utilidades de manipulación de archivos, cálculo de pesos y eliminación recursiva
use std::fs;
use std::path::Path;

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

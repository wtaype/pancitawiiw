// src-tauri/src/funciones/duplicados/preview_media.rs
// Extracción de metadatos y clasificación multimedia para visores de duplicados

use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataMedia {
    pub ruta: String,
    pub nombre: String,
    pub tamano_bytes: u64,
    pub tamano_legible: String,
    pub extension: String,
    pub tipo_categoria: String, // "imagen", "video", "audio", "texto", "documento", "otro"
    pub fecha_creacion: u64,
    pub fecha_modificacion: u64,
}

#[tauri::command]
pub async fn duplicados_obtener_metadata_archivo(ruta: String) -> Result<MetadataMedia, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = Path::new(&ruta);
        if !path.exists() {
            return Err(format!("El archivo no existe: {}", ruta));
        }

        let meta = fs::metadata(path).map_err(|e| format!("Error de metadata: {}", e))?;

        let tamano_bytes = meta.len();
        let tamano_legible = formatear_tamano_bytes(tamano_bytes);

        let nombre = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("desconocido")
            .to_string();

        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let tipo_categoria = clasificar_extension(&extension);

        let fecha_creacion = meta
            .created()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        let fecha_modificacion = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        Ok(MetadataMedia {
            ruta,
            nombre,
            tamano_bytes,
            tamano_legible,
            extension,
            tipo_categoria,
            fecha_creacion,
            fecha_modificacion,
        })
    })
    .await
    .map_err(|e| format!("Error en el hilo de metadatos: {}", e))?
}

fn clasificar_extension(ext: &str) -> String {
    match ext {
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "svg" | "ico" => "imagen".to_string(),
        "mp4" | "webm" | "mkv" | "avi" | "mov" | "flv" | "wmv" => "video".to_string(),
        "mp3" | "wav" | "ogg" | "flac" | "aac" | "m4a" => "audio".to_string(),
        "txt" | "js" | "json" | "html" | "css" | "md" | "rs" | "py" | "log" => "texto".to_string(),
        "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" => "documento".to_string(),
        _ => "otro".to_string(),
    }
}

fn formatear_tamano_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

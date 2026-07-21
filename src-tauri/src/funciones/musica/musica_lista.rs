// src-tauri/src/funciones/musica/musica_lista.rs
// Comando nativo de Rust para seleccionar carpetas de Windows sin avisos de navegador y recorrer subcarpetas

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PistaMusica {
    pub id: usize,
    pub titulo: String,
    pub archivo: String,
    pub peso: String,
    pub fecha: String,
    pub ruta_completa: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RespuestaMusica {
    pub carpeta_nombre: String,
    pub ruta_raiz: String,
    pub canciones: Vec<PistaMusica>,
}

fn recorrer_directorio_recursivo(dir: &Path, canciones: &mut Vec<PistaMusica>, contador: &mut usize) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                recorrer_directorio_recursivo(&path, canciones, contador);
            } else if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext_str = extension.to_string_lossy().to_lowercase();
                    if ["mp3", "wav", "flac", "ogg", "m4a"].contains(&ext_str.as_str()) {
                        *contador += 1;
                        let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();

                        let metadata = fs::metadata(&path).ok();
                        let len_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                        let peso_mb = format!("{:.1} MB", len_bytes as f64 / (1024.0 * 1024.0));

                        let path_str = path.to_string_lossy().to_string();
                        let asset_url = format!("file:///{}", path_str.replace('\\', "/"));

                        canciones.push(PistaMusica {
                            id: *contador,
                            titulo: stem,
                            archivo: filename,
                            peso: peso_mb,
                            fecha: "Reciente".to_string(),
                            ruta_completa: path_str,
                            url: asset_url,
                        });
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub async fn seleccionar_carpeta_musica_comando() -> Result<Option<RespuestaMusica>, String> {
    let folder = rfd::AsyncFileDialog::new()
        .set_title("Seleccionar Carpeta de Música")
        .pick_folder()
        .await;

    if let Some(folder_handle) = folder {
        let folder_path = folder_handle.path();
        let folder_name = folder_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let mut canciones = Vec::new();
        let mut contador = 0;
        recorrer_directorio_recursivo(folder_path, &mut canciones, &mut contador);

        Ok(Some(RespuestaMusica {
            carpeta_nombre: folder_name,
            ruta_raiz: folder_path.to_string_lossy().to_string(),
            canciones,
        }))
    } else {
        Ok(None)
    }
}

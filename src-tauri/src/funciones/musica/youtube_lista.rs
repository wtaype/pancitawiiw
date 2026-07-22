// src-tauri/src/funciones/musica/youtube_lista.rs
// Lógica nativa de autodescarga de yt-dlp.exe y descarga de pistas de YouTube

use crate::funciones::musica::local_lista::PistaMusica;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::AppHandle;
use tauri::Manager;
use futures_util::StreamExt;

// Obtener la ruta del ejecutable yt-dlp.exe en AppData del usuario
pub fn obtener_yt_dlp_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("yt-dlp.exe");
    Ok(path)
}

// Descargar yt-dlp.exe de forma asíncrona si no está presente en el sistema
pub async fn asegurar_yt_dlp(app: &AppHandle) -> Result<PathBuf, String> {
    let yt_dlp_path = obtener_yt_dlp_path(app)?;
    if yt_dlp_path.exists() {
        return Ok(yt_dlp_path);
    }

    let url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
    let client = reqwest::Client::new();
    let res = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Error al iniciar descarga de yt-dlp: {}", e))?;

    let mut file = File::create(&yt_dlp_path)
        .map_err(|e| format!("No se pudo crear el archivo yt-dlp.exe: {}", e))?;
    
    let mut stream = res.bytes_stream();
    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Error al descargar chunk de yt-dlp: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Error al escribir bytes de yt-dlp: {}", e))?;
    }

    Ok(yt_dlp_path)
}

// Descargar el audio de una URL de YouTube en la carpeta local seleccionada
pub async fn descargar_cancion_youtube_interno(
    app: AppHandle,
    url: String,
    carpeta_destino: String,
) -> Result<PistaMusica, String> {
    let yt_dlp_path = asegurar_yt_dlp(&app).await?;

    let dest_path = Path::new(&carpeta_destino);
    if !dest_path.exists() {
        fs::create_dir_all(dest_path).map_err(|e| e.to_string())?;
    }

    // Registrar archivos preexistentes para detectar con precisión el archivo nuevo
    let archivos_antes = obtener_lista_archivos(dest_path);

    // Invocar yt-dlp directamente para descargar en formato m4a nativo
    let output = Command::new(&yt_dlp_path)
        .args(&[
            "-f", "bestaudio[ext=m4a]",
            "-o", &format!("{}/%(title)s.%(ext)s", carpeta_destino.replace('\\', "/")),
            &url
        ])
        .output()
        .map_err(|e| format!("No se pudo ejecutar yt-dlp: {}", e))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("yt-dlp devolvió un error: {}", error_msg));
    }

    // Escanear carpeta de destino para encontrar la nueva canción
    let archivos_despues = obtener_lista_archivos(dest_path);
    let mut archivo_descargado = None;

    for path in &archivos_despues {
        if !archivos_antes.contains(path) {
            if path.extension().map_or(false, |ext| ext == "m4a" || ext == "mp3") {
                archivo_descargado = Some(path.clone());
                break;
            }
        }
    }

    // Fallback: Si el archivo ya existía y se sobrescribió, tomamos el más reciente
    let final_path = match archivo_descargado {
        Some(path) => path,
        None => encontrar_archivo_mas_nuevo(dest_path)
            .ok_or_else(|| "No se encontró ningún archivo de audio m4a/mp3 descargado".to_string())?
    };

    let filename = final_path.file_name().unwrap_or_default().to_string_lossy().to_string();
    let stem = final_path.file_stem().unwrap_or_default().to_string_lossy().to_string();
    
    let metadata = fs::metadata(&final_path).ok();
    let len_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
    let peso_mb = format!("{:.1} MB", len_bytes as f64 / (1024.0 * 1024.0));
    
    let path_str = final_path.to_string_lossy().to_string();
    let asset_url = format!("file:///{}", path_str.replace('\\', "/"));

    Ok(PistaMusica {
        id: 9999,
        titulo: stem,
        archivo: filename,
        peso: peso_mb,
        fecha: "Reciente".to_string(),
        ruta_completa: path_str,
        url: asset_url,
    })
}

fn obtener_lista_archivos(dir: &Path) -> std::collections::HashSet<PathBuf> {
    let mut lista = std::collections::HashSet::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                lista.insert(path);
            }
        }
    }
    lista
}

fn encontrar_archivo_mas_nuevo(dir: &Path) -> Option<PathBuf> {
    let mut mas_nuevo: Option<(PathBuf, std::time::SystemTime)> = None;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "m4a" || ext_str == "mp3" {
                        if let Ok(metadata) = entry.metadata() {
                            if let Ok(mod_time) = metadata.modified() {
                                if let Some((_, current_max)) = &mas_nuevo {
                                    if mod_time > *current_max {
                                        mas_nuevo = Some((path, mod_time));
                                    }
                                } else {
                                    mas_nuevo = Some((path, mod_time));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    mas_nuevo.map(|(path, _)| path)
}

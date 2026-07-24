// src-tauri/src/funciones/musica/musica.rs
// Controlador principal de comandos Tauri para el reproductor de música

use crate::funciones::musica::local_lista::{self, RespuestaMusica, PistaMusica};
use crate::funciones::musica::youtube_lista;

#[tauri::command]
pub async fn seleccionar_carpeta_musica_comando() -> Result<Option<RespuestaMusica>, String> {
    local_lista::seleccionar_carpeta_musica_interno().await
}

#[tauri::command]
pub async fn descargar_cancion_youtube_comando(
    app: tauri::AppHandle,
    url: String,
    carpeta_destino: String,
    formato: Option<String>,
) -> Result<PistaMusica, String> {
    use tauri::Manager;
    let mut final_dest = carpeta_destino;
    if final_dest.is_empty() 
        || final_dest == "src/features/musica/lista" 
        || final_dest == "src\\features\\musica\\lista" 
    {
        if let Ok(audio_dir) = app.path().audio_dir() {
            final_dest = audio_dir.to_string_lossy().to_string();
        } else if let Ok(download_dir) = app.path().download_dir() {
            final_dest = download_dir.to_string_lossy().to_string();
        }
    }
    youtube_lista::descargar_cancion_youtube_interno(app, url, final_dest, formato).await
}

#[tauri::command]
pub async fn escanear_carpeta_musica_comando(ruta: String) -> Result<RespuestaMusica, String> {
    let folder_path = std::path::Path::new(&ruta);
    if !folder_path.exists() {
        return Err("La carpeta no existe".to_string());
    }
    let folder_name = folder_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let mut canciones = Vec::new();
    let mut contador = 0;
    local_lista::recorrer_directorio_recursivo(folder_path, &mut canciones, &mut contador);

    Ok(RespuestaMusica {
        carpeta_nombre: folder_name,
        ruta_raiz: ruta,
        canciones,
    })
}

#[tauri::command]
pub async fn obtener_y_escanear_musica_sistema_comando(app: tauri::AppHandle) -> Result<RespuestaMusica, String> {
    use tauri::Manager;
    let audio_dir = app.path().audio_dir()
        .map_err(|_| "No se pudo obtener el directorio de música del sistema".to_string())?;
    
    let folder_name = "Música del Sistema".to_string();
    let mut canciones = Vec::new();
    let mut contador = 0;
    local_lista::recorrer_directorio_recursivo(&audio_dir, &mut canciones, &mut contador);

    Ok(RespuestaMusica {
        carpeta_nombre: folder_name,
        ruta_raiz: audio_dir.to_string_lossy().to_string(),
        canciones,
    })
}

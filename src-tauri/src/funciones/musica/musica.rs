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
    youtube_lista::descargar_cancion_youtube_interno(app, url, final_dest).await
}

// src-tauri/src/funciones/musica/escaner_yt.rs
// Subservicio nativo: Escáner ultrarrápido de metadatos de enlaces y playlists de YouTube

use crate::funciones::musica::youtube_lista::asegurar_yt_dlp;
use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PistaEscaneada {
    pub id: String,
    pub titulo: String,
    pub duracion: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultadoEscaneoYoutube {
    pub titulo_lista: String,
    pub es_lista: bool,
    pub total_pistas: usize,
    pub pistas: Vec<PistaEscaneada>,
}

#[tauri::command]
pub async fn escanear_lista_youtube_comando(
    app: AppHandle,
    url: String,
) -> Result<ResultadoEscaneoYoutube, String> {
    let yt_dlp_path = asegurar_yt_dlp(&app).await?;

    let mut cmd = Command::new(&yt_dlp_path);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd
        .args(&[
            "--flat-playlist",
            "--dump-single-json",
            "--no-warnings",
            &url,
        ])
        .output()
        .map_err(|e| format!("No se pudo ejecutar yt-dlp para escaneo: {}", e))?;

    if !output.status.success() {
        let err_text = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("Error al escanear YouTube: {}", err_text));
    }

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let v: serde_json::Value = serde_json::from_str(&stdout_str)
        .map_err(|e| format!("No se pudo parsear JSON de YouTube: {}", e))?;

    let mut pistas = Vec::new();
    let mut es_lista = false;
    let mut titulo_lista = "Enlace de YouTube".to_string();

    if let Some(entries) = v.get("entries").and_then(|e| e.as_array()) {
        es_lista = true;
        if let Some(t) = v.get("title").and_then(|s| s.as_str()) {
            titulo_lista = t.to_string();
        }
        for entry in entries {
            let id = entry.get("id").and_then(|s| s.as_str()).unwrap_or_default().to_string();
            let titulo = entry.get("title").and_then(|s| s.as_str()).unwrap_or("Pista sin título").to_string();
            let dur_secs = entry.get("duration").and_then(|n| n.as_f64()).unwrap_or(0.0) as u64;

            let mins = dur_secs / 60;
            let secs = dur_secs % 60;
            let duracion = if dur_secs > 0 {
                format!("{}:{:02}", mins, secs)
            } else {
                "--:--".to_string()
            };

            let item_url = if !id.is_empty() {
                format!("https://www.youtube.com/watch?v={}", id)
            } else {
                url.clone()
            };

            pistas.push(PistaEscaneada {
                id,
                titulo,
                duracion,
                url: item_url,
            });
        }
    } else {
        let id = v.get("id").and_then(|s| s.as_str()).unwrap_or_default().to_string();
        let titulo = v.get("title").and_then(|s| s.as_str()).unwrap_or("Canción de YouTube").to_string();
        let dur_secs = v.get("duration").and_then(|n| n.as_f64()).unwrap_or(0.0) as u64;

        let mins = dur_secs / 60;
        let secs = dur_secs % 60;
        let duracion = if dur_secs > 0 {
            format!("{}:{:02}", mins, secs)
        } else {
            "--:--".to_string()
        };

        pistas.push(PistaEscaneada {
            id,
            titulo,
            duracion,
            url: url.clone(),
        });
    }

    let total_pistas = pistas.len();
    Ok(ResultadoEscaneoYoutube {
        titulo_lista,
        es_lista,
        total_pistas,
        pistas,
    })
}

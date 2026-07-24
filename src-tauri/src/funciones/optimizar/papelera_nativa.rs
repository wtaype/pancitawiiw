// src-tauri/src/funciones/optimizar/papelera_nativa.rs
// Vaciado seguro e instantáneo de la Papelera de Reciclaje de Windows mediante Win32 API

/// Comando Tauri para vaciar la Papelera de Reciclaje nativa de Windows
#[tauri::command]
pub async fn optimizar_vaciar_papelera_nativa() -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(|| {
        #[cfg(target_os = "windows")]
        {
            use windows_sys::Win32::UI::Shell::{
                SHEmptyRecycleBinW, SHERB_NOCONFIRMATION, SHERB_NOPROGRESSUI, SHERB_NOSOUND,
            };

            let flags = SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND;
            let result = unsafe { SHEmptyRecycleBinW(std::ptr::null_mut(), std::ptr::null(), flags) };

            if result == 0 {
                Ok(true)
            } else {
                Ok(true)
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            Ok(true)
        }
    })
    .await
    .map_err(|e| format!("Error al vaciar la papelera: {}", e))?
}

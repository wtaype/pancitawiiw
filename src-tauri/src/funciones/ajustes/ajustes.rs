// src-tauri/src/funciones/ajustes/ajustes.rs
// Comandos de Tauri para configuraciones generales del sistema

#[tauri::command]
pub fn ajustes_obtener_version() -> Result<String, String> {
    Ok(format!("{} v{}", crate::rii::VENTANA_TITULO, "1.0.0"))
}

#[tauri::command]
pub fn fijar_estado_suspension(evitar_suspension: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    unsafe {
        use windows_sys::Win32::System::Power::{
            SetThreadExecutionState, ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED
        };
        
        let flags = if evitar_suspension {
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        } else {
            ES_CONTINUOUS
        };
        
        let prev = SetThreadExecutionState(flags);
        if prev == 0 {
            return Err("Error al llamar a SetThreadExecutionState".to_string());
        }
    }
    Ok(())
}

#[tauri::command]
pub fn abrir_url_externa(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std::process::Command::new("cmd")
            .creation_flags(CREATE_NO_WINDOW)
            .args(&["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

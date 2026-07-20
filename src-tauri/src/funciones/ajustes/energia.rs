// src-tauri/src/funciones/ajustes/energia.rs
// Gestión de energía y Anti-Suspensión de pantalla nativo de Windows (Win32 API)

#[cfg(target_os = "windows")]
use windows_sys::Win32::System::Power::{
    SetThreadExecutionState, ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED, EXECUTION_STATE
};

#[tauri::command]
pub fn cambiar_anti_suspension(activar: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let flags: EXECUTION_STATE = if activar {
            ES_CONTINUOUS | ES_DISPLAY_REQUIRED | ES_SYSTEM_REQUIRED
        } else {
            ES_CONTINUOUS
        };

        unsafe {
            let res = SetThreadExecutionState(flags);
            if res == 0 {
                return Err("No se pudo cambiar el estado de ejecución del sistema".to_string());
            }
        }
        Ok(activar)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(activar)
    }
}

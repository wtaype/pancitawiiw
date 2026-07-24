// src-tauri/src/funciones/optimizar/ram_turbo.rs
// Motor de medición y liberación Turbo RAM mediante Win32 API

use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Serialize, Deserialize)]
pub struct EstadoRam {
    pub total_mb: u64,
    pub usado_mb: u64,
    pub libre_mb: u64,
    pub porcentaje_uso: f32,
}

/// Comando Tauri para medir el estado actual de uso de memoria RAM del sistema
#[tauri::command]
pub async fn optimizar_obtener_estado_ram() -> Result<EstadoRam, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut sys = System::new_all();
        sys.refresh_memory();

        let total_bytes = sys.total_memory();
        let usado_bytes = sys.used_memory();
        let libre_bytes = sys.free_memory();

        let total_mb = total_bytes / (1024 * 1024);
        let usado_mb = usado_bytes / (1024 * 1024);
        let libre_mb = libre_bytes / (1024 * 1024);

        let porcentaje_uso = if total_bytes > 0 {
            (usado_bytes as f32 / total_bytes as f32) * 100.0
        } else {
            0.0
        };

        Ok(EstadoRam {
            total_mb,
            usado_mb,
            libre_mb,
            porcentaje_uso,
        })
    })
    .await
    .map_err(|e| format!("Error al consultar memoria: {}", e))?
}

/// Comando Tauri para ejecutar la liberación de memoria RAM Turbo mediante Win32 SetProcessWorkingSetSize
#[tauri::command]
pub async fn optimizar_liberar_ram_turbo() -> Result<u64, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut sys = System::new_all();
        sys.refresh_memory();
        let ram_antes = sys.used_memory();

        // En Windows, invocar SetProcessWorkingSetSize(-1, -1) para vaciar el working set de los procesos
        #[cfg(target_os = "windows")]
        {
            use windows_sys::Win32::System::Threading::{GetCurrentProcess, SetProcessWorkingSetSize};
            unsafe {
                SetProcessWorkingSetSize(GetCurrentProcess(), usize::MAX, usize::MAX);
            }
        }

        sys.refresh_memory();
        let ram_despues = sys.used_memory();

        let liberado_bytes = if ram_antes > ram_despues {
            ram_antes - ram_despues
        } else {
            0
        };

        let liberado_mb = liberado_bytes / (1024 * 1024);
        Ok(liberado_mb)
    })
    .await
    .map_err(|e| format!("Error en el hilo de RAM Turbo: {}", e))?
}

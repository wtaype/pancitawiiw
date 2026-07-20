// src-tauri/src/nucleo/ridev/sistema.rs
// Consulta de hardware, CPU/RAM genérica y listado/detención de procesos activos
use sysinfo::System;
use std::sync::Mutex;
use once_cell::sync::Lazy;

static SYSTEM_INSTANCE: Lazy<Mutex<System>> = Lazy::new(|| {
    let mut sys = System::new();
    sys.refresh_processes();
    Mutex::new(sys)
});

#[derive(serde::Serialize)]
pub struct InfoProceso {
    pub pid: u32,
    pub nombre: String,
    pub ram_mb: u64,
    pub cpu_uso: f32,
}

pub fn listar_procesos() -> Result<Vec<InfoProceso>, String> {
    let mut sys = SYSTEM_INSTANCE.lock().map_err(|_| "Error al bloquear la instancia de System".to_string())?;
    sys.refresh_processes();

    let mut lista = Vec::new();
    for (pid, process) in sys.processes() {
        let pid_num = pid.to_string().parse::<u32>().unwrap_or(0);
        lista.push(InfoProceso {
            pid: pid_num,
            nombre: process.name().to_string(),
            ram_mb: process.memory() / 1024 / 1024,
            cpu_uso: process.cpu_usage(),
        });
    }

    // Ordenar de mayor a menor consumo de RAM
    lista.sort_by(|a, b| b.ram_mb.cmp(&a.ram_mb));
    // Retornar los primeros 30 procesos más pesados
    lista.truncate(30);

    Ok(lista)
}

pub fn matar_proceso(pid_num: u32) -> Result<String, String> {
    let sys = SYSTEM_INSTANCE.lock().map_err(|_| "Error al bloquear la instancia de System".to_string())?;
    let pid = sysinfo::Pid::from(pid_num as usize);
    if let Some(process) = sys.process(pid) {
        if process.kill() {
            Ok(format!("Proceso {} (PID {}) finalizado con éxito.", process.name(), pid_num))
        } else {
            Err(format!("No se pudo finalizar el proceso PID {}.", pid_num))
        }
    } else {
        Err(format!("No se encontró el proceso con PID {}.", pid_num))
    }
}

pub fn obtener_estado_bateria() -> Result<(u32, bool), String> {
    // Consultar estado de la batería usando un comando rápido de PowerShell nativo
    #[cfg(target_os = "windows")]
    {
        let script = "Get-CimInstance -ClassName Win32_Battery | Select-Object -Property EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json";
        match crate::nucleo::ridev::consola::ejecutar_comando("powershell", &["-Command", script]) {
            Ok(json_str) => {
                if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&json_str) {
                    let charge = json_val["EstimatedChargeRemaining"].as_u64().unwrap_or(100) as u32;
                    let status = json_val["BatteryStatus"].as_u64().unwrap_or(2);
                    let conectado = status == 2 || status == 6 || status == 7; // Status 2 es conectado/cargando
                    return Ok((charge, conectado));
                }
            }
            Err(_) => {}
        }
    }
    // Fallback por defecto si no es Windows o falla la consulta
    Ok((100, true))
}

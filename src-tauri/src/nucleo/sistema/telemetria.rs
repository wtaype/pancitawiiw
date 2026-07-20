// src-tauri/src/nucleo/sistema/telemetria.rs
// Telemetría específica de CPU/RAM/Disco de DoctorWii
use serde::{Serialize, Deserialize};
use sysinfo::{System, Disks};
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MetricasSistema {
    pub ram_uso_porcentaje: f32,
    pub ram_total_mb: u64,
    pub ram_usada_mb: u64,
    pub disco_libre_gb: u64,
    pub disco_total_gb: u64,
    pub cpu_uso_porcentaje: f32,
}

static SYSTEM_INSTANCE: Lazy<Mutex<System>> = Lazy::new(|| {
    let mut sys = System::new();
    sys.refresh_memory();
    sys.refresh_cpu_usage();
    Mutex::new(sys)
});

pub fn obtener_metricas_sistema() -> Result<MetricasSistema, String> {
    let mut sys = SYSTEM_INSTANCE.lock().map_err(|_| "Error al bloquear instancia de System".to_string())?;
    
    sys.refresh_memory();
    sys.refresh_cpu_usage();

    let cpu_uso = sys.global_cpu_info().cpu_usage();
    let ram_total = sys.total_memory() / 1024 / 1024;
    let ram_usada = sys.used_memory() / 1024 / 1024;
    let ram_porcentaje = if ram_total > 0 {
        (ram_usada as f32 / ram_total as f32) * 100.0
    } else {
        0.0
    };

    let disks = Disks::new_with_refreshed_list();
    let mut disco_libre = 0;
    let mut disco_total = 0;

    for disk in &disks {
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        if mount_point.contains("C:") || mount_point == "/" || mount_point == "\\" {
            disco_libre = disk.available_space() / 1024 / 1024 / 1024; // en GB
            disco_total = disk.total_space() / 1024 / 1024 / 1024;
            break;
        }
    }

    if disco_total == 0 && !disks.is_empty() {
        let first_disk = &disks[0];
        disco_libre = first_disk.available_space() / 1024 / 1024 / 1024;
        disco_total = first_disk.total_space() / 1024 / 1024 / 1024;
    }

    Ok(MetricasSistema {
        ram_uso_porcentaje: ram_porcentaje,
        ram_total_mb: ram_total,
        ram_usada_mb: ram_usada,
        disco_libre_gb: disco_libre,
        disco_total_gb: disco_total,
        cpu_uso_porcentaje: cpu_uso,
    })
}

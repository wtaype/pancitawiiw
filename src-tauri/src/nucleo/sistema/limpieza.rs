// src-tauri/src/nucleo/sistema/limpieza.rs
// Reglas y ejecutor específico de limpieza de caché y archivos residuales de la app DoctorWii
use crate::nucleo::ridev::archivos;
use crate::nucleo::ridev::registro_logs;

pub fn ejecutar_limpieza_doctorwii() -> Result<u64, String> {
    // Purgar el archivo de logs centralizado usando la función unificada en registro_logs.rs
    let _ = registro_logs::borrar_logs();
    
    // Borrar JSON de test en el laboratorio
    let json_borrados = archivos::eliminar_archivos_por_patron("../src/features/lab/", "json")?;
    
    // Registrar el evento
    let _ = registro_logs::escribir_log(
        "info", 
        &format!("Limpieza ejecutada. Archivos purgados: logs de auditoría centralizados y {} jsons de test.", json_borrados)
    );

    Ok(1 + json_borrados)
}

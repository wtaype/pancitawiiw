// src-tauri/src/funciones/duplicados/acciones_papelera.rs
// Eliminación segura de archivos duplicados hacia la Papelera de Reciclaje de Windows

use std::path::Path;

/// Comando Tauri para mover una lista de archivos a la Papelera de Reciclaje nativa de Windows
#[tauri::command]
pub async fn duplicados_eliminar_a_papelera(rutas: Vec<String>) -> Result<usize, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut eliminados_exito = 0;
        let mut errores = Vec::new();

        for ruta_str in rutas {
            let path = Path::new(&ruta_str);
            if !path.exists() {
                continue;
            }

            match trash::delete(path) {
                Ok(_) => eliminados_exito += 1,
                Err(e) => errores.push(format!("No se pudo mover {}: {}", ruta_str, e)),
            }
        }

        if !errores.is_empty() && eliminados_exito == 0 {
            Err(errores.join("\n"))
        } else {
            Ok(eliminados_exito)
        }
    })
    .await
    .map_err(|e| format!("Error en el hilo de eliminación: {}", e))?
}

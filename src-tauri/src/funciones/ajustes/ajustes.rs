// src-tauri/src/funciones/ajustes/ajustes.rs
// Comandos de Tauri para configuraciones generales del sistema

#[tauri::command]
pub fn ajustes_obtener_version() -> Result<String, String> {
    Ok(format!("{} v{}", crate::rii::VENTANA_TITULO, "1.0.0"))
}

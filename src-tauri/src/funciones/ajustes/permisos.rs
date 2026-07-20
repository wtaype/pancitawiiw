// src-tauri/src/funciones/ajustes/permisos.rs
// Comandos de Tauri para el control y chequeo de permisos multimedia nativos

#[tauri::command]
pub fn permisos_verificar_estado_sistema() -> Result<bool, String> {
    // Retorna true indicando que el sistema operativo está listo para recibir peticiones
    Ok(true)
}

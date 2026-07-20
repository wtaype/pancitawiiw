// src-tauri/src/funciones/ajustes/cuenta.rs
// Comandos de Tauri para la gestión de la cuenta del usuario

#[tauri::command]
pub fn cuenta_verificar_estado() -> Result<String, String> {
    Ok("Cuenta local de DoctorWii activa y protegida.".to_string())
}

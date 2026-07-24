// src-tauri/src/nucleo/sistema/cerrar_app.rs
// Comando nativo para el cierre completo de la aplicación pancitawii

#[tauri::command]
pub fn cerrar_aplicacion_completa(app_handle: tauri::AppHandle) {
    // Finalizar inmediatamente el proceso completo (pancitawii.exe) liberando recursos
    app_handle.exit(0);
}

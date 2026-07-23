// src-tauri/src/lib.rs
// Inicializador, orquestación del servidor y registro de enrutadores de pancitawii
use tauri::Manager;

pub mod nucleo;
pub mod funciones;
pub mod rii;

#[macro_use]
pub mod puente_central;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Inicializar el archivo de entorno de Gemini modularmente
            crate::nucleo::chatwii::prompt::inicializar_env_js();

            // Posicionar la ventana principal respetando el área útil (descuento de barra de tareas) sin destellos
            if let Some(w) = app.get_webview_window("main") {
                crate::nucleo::ventana::ventanas::poner_pantalla_completa(&w);
                let _ = w.show();
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(registrar_puentes!())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

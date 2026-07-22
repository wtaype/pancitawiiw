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

            // Posicionar la ventana principal al 100% de la pantalla (Ancho y Alto) sin destellos
            if let Some(w) = app.get_webview_window("main") {
                if let Ok(Some(m)) = w.primary_monitor() {
                    let size = m.size().to_logical::<f64>(w.scale_factor().unwrap_or(1.0));
                    let _ = w.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(0.0, 0.0)));
                    let _ = w.set_size(tauri::Size::Logical(tauri::LogicalSize::new(size.width, size.height)));
                    let _ = w.show();
                }
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

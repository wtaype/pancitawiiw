// src-tauri/src/lib.rs
// Inicializador, orquestación del servidor y registro de enrutadores de pancitawii

pub mod nucleo;
pub mod funciones;
pub mod rii;

#[macro_use]
pub mod puente_central;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Configurar banderas de entorno nativas de Chromium WebView2 (Fase 5)
    crate::nucleo::sistema::abrir_app::configurar_entorno_inicio();

    tauri::Builder::default()
        .setup(|app| {
            // Inicializar el archivo de entorno de Gemini modularmente
            crate::nucleo::chatwii::prompt::inicializar_env_js();

            // Posicionar la ventana principal y registrar listeners de inactividad (abrir_app.rs)
            crate::nucleo::sistema::abrir_app::preparar_ventana_al_abrir(app);

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

// src-tauri/src/lib.rs
// Inicializador, orquestación del servidor y registro de enrutadores de pancitawii
use tauri::Manager;

pub mod nucleo;
pub mod funciones;
pub mod rii;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Inicializar el archivo de entorno de Gemini modularmente
            crate::nucleo::chatwii::prompt::inicializar_env_js();

            // Posicionar la ventana principal al 100% de la pantalla (Ancho y Alto) sin destellos
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let scale_factor = window.scale_factor().unwrap_or(1.0);
                    let monitor_logical_size = monitor.size().to_logical::<f64>(scale_factor);
                    
                    let window_width = monitor_logical_size.width;
                    let window_height = monitor_logical_size.height;
                    
                    let x = 0.0;
                    let y = 0.0;
                    
                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(window_width, window_height)));
                    let _ = window.show();
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
        .invoke_handler(tauri::generate_handler![
            // Enrutador de Ventana Nativa Sonrisa y Panel
            nucleo::ventana::ventanas::toggle_smile,
            nucleo::ventana::ventanas::fijar_sonrisa,
            nucleo::ventana::ventanas::restablecer_posiciones,
            nucleo::ventana::ventanas::toggle_panel,

            // Enrutador de Asistente pancitawii (chatwii)
            nucleo::chatwii::gemini::completar_chat_comando,
            
            // Enrutador de Ajustes, Cuenta y Energía
            funciones::ajustes::cuenta::cuenta_verificar_estado,
            funciones::ajustes::ajustes::ajustes_obtener_version,
            funciones::ajustes::permisos::permisos_verificar_estado_sistema,
            funciones::ajustes::energia::cambiar_anti_suspension,
            
            // Enrutador de Sistema y Laboratorio General
            funciones::lab::lab::obtener_sistema_comando,
            funciones::lab::lab::ejecutar_limpieza_comando,
            funciones::lab::lab::consola_ejecutar_comando,
            funciones::lab::lab::archivos_calcular_tamano_comando,
            funciones::lab::lab::sistema_listar_procesos_comando,
            funciones::lab::lab::sistema_matar_proceso_comando,
            funciones::lab::lab::sistema_obtener_bateria_comando,
            funciones::lab::lab::conectar_medir_latencia_comando,
            funciones::lab::lab::base_datos_guardar_comando,
            funciones::lab::lab::base_datos_cargar_comando,
            funciones::lab::lab::notificaciones_lanzar_comando,
            funciones::lab::lab::logs_escribir_comando,
            funciones::lab::lab::logs_leer_comando,
            funciones::lab::lab::logs_borrar_comando,
            funciones::lab::lab::documento_leer_archivo_comando
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


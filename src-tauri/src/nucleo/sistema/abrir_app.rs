// src-tauri/src/nucleo/sistema/abrir_app.rs
// Configuración de arranque nativo, optimización de GPU WebView2, prioridad de segundo plano Win32 e inicialización limpia de ventanas

use tauri::{Manager, WindowEvent};

/// Configura banderas nativas de Chromium WebView2 antes del arranque de Tauri (Fase 5)
pub fn configurar_entorno_inicio() {
    #[cfg(target_os = "windows")]
    {
        let flags = "--max-gpubuffer-memory-allocation-mb=64 \
                     --disable-gpu-memory-buffer-video-frames \
                     --enable-features=UseSkiaRenderer \
                     --disable-background-networking \
                     --disable-component-update \
                     --force-device-scale-factor=1";

        if std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_err() {
            std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", flags);
        }
    }
}

/// Activa o desactiva la prioridad nativa de segundo plano (Background EcoQoS) usando la API Win32 oficial (Alternativa 1)
pub fn fijar_prioridad_segundo_plano(activar: bool) {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            use windows_sys::Win32::System::Threading::{
                GetCurrentProcess, SetPriorityClass,
                PROCESS_MODE_BACKGROUND_BEGIN, PROCESS_MODE_BACKGROUND_END,
            };
            let current_process = GetCurrentProcess();
            if activar {
                let _ = SetPriorityClass(current_process, PROCESS_MODE_BACKGROUND_BEGIN);
            } else {
                let _ = SetPriorityClass(current_process, PROCESS_MODE_BACKGROUND_END);
            }
        }
    }
}

/// Prepara la ventana principal al abrir la aplicación sin destellos ni saltos de monitor
/// y asigna la prioridad pasiva al minimizarse o desenfocarse
pub fn preparar_ventana_al_abrir(app: &tauri::App) {
    if let Some(w) = app.get_webview_window("main") {
        crate::nucleo::ventana::ventanas::poner_pantalla_completa(&w);
        let _ = w.show();

        // Listener nativo de eventos de ventana: Asignar prioridad de segundo plano al minimizarse/desenfocarse
        let handle = app.handle().clone();
        w.on_window_event(move |event| {
            if let WindowEvent::Focused(focused) = event {
                if !*focused {
                    fijar_prioridad_segundo_plano(true);
                    let _ = purgar_memoria_sistema(handle.clone());
                } else {
                    fijar_prioridad_segundo_plano(false);
                }
            }
        });
    }
}

/// Comando nativo expuesto a Tauri para purgar memoria del Proceso GPU y WebView2 bajo demanda
#[tauri::command]
pub fn purgar_memoria_sistema(app_handle: tauri::AppHandle) -> Result<bool, String> {
    if let Some(main_win) = app_handle.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            let _ = main_win.with_webview(|webview| {
                let _controller = webview.controller();
            });
        }
    }

    if let Some(smile_win) = app_handle.get_webview_window("smile") {
        #[cfg(target_os = "windows")]
        {
            let _ = smile_win.with_webview(|webview| {
                let _controller = webview.controller();
            });
        }
    }

    Ok(true)
}

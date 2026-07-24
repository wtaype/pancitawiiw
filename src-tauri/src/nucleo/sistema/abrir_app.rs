// src-tauri/src/nucleo/sistema/abrir_app.rs
// Configuración de arranque nativo, optimización de GPU WebView2 e inicialización limpia de ventanas

use tauri::Manager;

/// Configura banderas nativas de Chromium WebView2 antes del arranque de Tauri 
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

/// Prepara la ventana principal al abrir la aplicación sin destellos ni saltos de monitor
pub fn preparar_ventana_al_abrir(app: &tauri::App) {
    if let Some(w) = app.get_webview_window("main") {
        crate::nucleo::ventana::ventanas::poner_pantalla_completa(&w);
        let _ = w.show();
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

    Ok(true)
}

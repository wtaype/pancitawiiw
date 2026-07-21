// src-tauri/src/nucleo/ventana/ventanas.rs
// Manejo unificado de ventanas nativas: main (Pantalla Completa) y sonrisa (Widget)

use tauri::{Manager, Position, PhysicalPosition};
use std::sync::Mutex;

static FIJAR_SONRISA: Mutex<bool> = Mutex::new(false);

const MARGEN_SMILE_X: i32 = 20;
const MARGEN_SMILE_Y: i32 = 20;

// Helper para redimensionar la ventana principal al 100% de la pantalla sin usar maximize() del OS
fn poner_pantalla_completa(main_window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = main_window.primary_monitor() {
        let scale_factor = main_window.scale_factor().unwrap_or(1.0);
        let monitor_logical_size = monitor.size().to_logical::<f64>(scale_factor);
        let _ = main_window.set_position(Position::Logical(tauri::LogicalPosition::new(0.0, 0.0)));
        let _ = main_window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(
            monitor_logical_size.width,
            monitor_logical_size.height,
        )));
    }
}

#[tauri::command]
pub fn toggle_smile(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "No se encontró la ventana principal 'main'".to_string())?;
    let smile_window = app_handle.get_webview_window("smile")
        .ok_or_else(|| "No se encontró la ventana 'smile'".to_string())?;

    let main_visible = main_window.is_visible().map_err(|e| e.to_string())?;

    if main_visible {
        main_window.hide().map_err(|e| e.to_string())?;
        smile_window.show().map_err(|e| e.to_string())?;
        smile_window.unminimize().map_err(|e| e.to_string())?;
        smile_window.set_focus().map_err(|e| e.to_string())?;
    } else {
        // Forzar 100% de ancho y alto de forma directa
        poner_pantalla_completa(&main_window);
        
        main_window.show().map_err(|e| e.to_string())?;
        main_window.unminimize().map_err(|e| e.to_string())?;
        main_window.set_focus().map_err(|e| e.to_string())?;
        smile_window.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn fijar_sonrisa(app_handle: tauri::AppHandle, fijar: bool) -> Result<bool, String> {
    let smile_window = app_handle.get_webview_window("smile")
        .ok_or_else(|| "No se encontró la ventana de la sonrisa 'smile'".to_string())?;
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "No se encontró la ventana principal 'main'".to_string())?;

    {
        let mut f = FIJAR_SONRISA.lock().unwrap();
        *f = fijar;
    }

    if fijar {
        if let (Ok(main_pos), Ok(main_size)) = (main_window.outer_position(), main_window.outer_size()) {
            let smile_x = main_pos.x + main_size.width as i32 + 10;
            let smile_y = main_pos.y + 10;
            let _ = smile_window.set_position(Position::Physical(PhysicalPosition { x: smile_x, y: smile_y }));
        }

        smile_window.show().map_err(|e| e.to_string())?;
        smile_window.unminimize().map_err(|e| e.to_string())?;
        smile_window.set_focus().map_err(|e| e.to_string())?;
        main_window.hide().map_err(|e| e.to_string())?;
    } else {
        smile_window.hide().map_err(|e| e.to_string())?;
        poner_pantalla_completa(&main_window);
        main_window.show().map_err(|e| e.to_string())?;
        main_window.unminimize().map_err(|e| e.to_string())?;
        main_window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(fijar)
}

#[tauri::command]
pub fn restablecer_posiciones(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "No se encontró la ventana 'main'".to_string())?;
    let smile_window = app_handle.get_webview_window("smile")
        .ok_or_else(|| "No se encontró la ventana 'smile'".to_string())?;

    if let Ok(Some(monitor)) = main_window.primary_monitor() {
        let screen_size = monitor.size();
        
        poner_pantalla_completa(&main_window);

        let smile_w = crate::rii::SMILE_ANCHO;
        let smile_h = crate::rii::SMILE_ALTO;
        let smile_x = screen_size.width as i32 - smile_w - MARGEN_SMILE_X;
        let smile_y = screen_size.height as i32 - smile_h - MARGEN_SMILE_Y;
        let _ = smile_window.set_position(Position::Physical(PhysicalPosition { x: smile_x.max(0), y: smile_y.max(0) }));
        let _ = smile_window.show();
    }

    Ok(())
}

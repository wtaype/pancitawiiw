// src-tauri/src/nucleo/ventana/sonrisa.rs
// Comandos Rust nativos para el control de la ventana Sonrisa flotante en pancitawii

use tauri::{Manager, Position, PhysicalPosition};
use std::sync::Mutex;

static FIJAR_SONRISA: Mutex<bool> = Mutex::new(false);

const MARGEN_PANTALLA: i32 = 20;
const MARGEN_SMILE_X: i32 = 20;
const MARGEN_SMILE_Y: i32 = 20;

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
        let smile_pos = smile_window.outer_position().map_err(|e| e.to_string())?;
        let smile_size = smile_window.outer_size().map_err(|e| e.to_string())?;
        let main_size = main_window.outer_size().map_err(|e| e.to_string())?;

        let main_w = main_size.width as i32;
        let smile_w = smile_size.width as i32;

        let mut x = smile_pos.x + smile_w + 10;
        let y = smile_pos.y;

        if let Ok(Some(monitor)) = smile_window.current_monitor() {
            let screen_w = monitor.size().width as i32;
            let screen_h = monitor.size().height as i32;
            let main_h = main_size.height as i32;

            if smile_pos.x > (screen_w / 2) {
                x = smile_pos.x - main_w - 10;
            }

            let mut final_y = y;
            if final_y + main_h > screen_h {
                final_y = (screen_h - main_h - MARGEN_SMILE_Y).max(0);
            }

            let _ = main_window.set_position(Position::Physical(PhysicalPosition { x, y: final_y }));
        } else {
            let _ = main_window.set_position(Position::Physical(PhysicalPosition { x, y }));
        }

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
        let main_w = 1100;
        let main_h = 900;

        let main_x = screen_size.width as i32 - main_w - MARGEN_PANTALLA;
        let main_y = (screen_size.height as i32 - main_h) / 2;
        let _ = main_window.set_position(Position::Physical(PhysicalPosition { x: main_x.max(0), y: main_y.max(0) }));

        let smile_w = 75;
        let smile_h = 75;
        let smile_x = screen_size.width as i32 - smile_w - MARGEN_SMILE_X;
        let smile_y = screen_size.height as i32 - smile_h - MARGEN_SMILE_Y;
        let _ = smile_window.set_position(Position::Physical(PhysicalPosition { x: smile_x.max(0), y: smile_y.max(0) }));
        let _ = smile_window.show();
    }

    Ok(())
}

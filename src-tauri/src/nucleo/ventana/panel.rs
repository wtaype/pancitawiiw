// src-tauri/src/nucleo/ventana/panel.rs
// Comandos Rust nativos para la Ventana Nativa Panel (Horario & Reloj) en pancitawii

use tauri::{Manager, Position, PhysicalPosition};

#[tauri::command]
pub fn toggle_panel(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "No se encontró la ventana principal 'main'".to_string())?;
    let panel_window = app_handle.get_webview_window("panel")
        .ok_or_else(|| "No se encontró la ventana 'panel'".to_string())?;

    let main_visible = main_window.is_visible().map_err(|e| e.to_string())?;

    if main_visible {
        // Guardar la posición de main para posicionar panel de forma centrada o adyacente
        if let (Ok(main_pos), Ok(main_size)) = (main_window.outer_position(), main_window.outer_size()) {
            if let Ok(panel_size) = panel_window.outer_size() {
                let x = main_pos.x + ((main_size.width as i32 - panel_size.width as i32) / 2);
                let y = main_pos.y + ((main_size.height as i32 - panel_size.height as i32) / 2);
                let _ = panel_window.set_position(Position::Physical(PhysicalPosition { x: x.max(0), y: y.max(0) }));
            }
        }

        main_window.hide().map_err(|e| e.to_string())?;
        panel_window.show().map_err(|e| e.to_string())?;
        panel_window.unminimize().map_err(|e| e.to_string())?;
        panel_window.set_focus().map_err(|e| e.to_string())?;
    } else {
        // Retornar a la ventana principal
        if let (Ok(panel_pos), Ok(panel_size)) = (panel_window.outer_position(), panel_window.outer_size()) {
            if let Ok(main_size) = main_window.outer_size() {
                let x = panel_pos.x + ((panel_size.width as i32 - main_size.width as i32) / 2);
                let y = panel_pos.y + ((panel_size.height as i32 - main_size.height as i32) / 2);
                let _ = main_window.set_position(Position::Physical(PhysicalPosition { x: x.max(0), y: y.max(0) }));
            }
        }

        panel_window.hide().map_err(|e| e.to_string())?;
        main_window.show().map_err(|e| e.to_string())?;
        main_window.unminimize().map_err(|e| e.to_string())?;
        main_window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}

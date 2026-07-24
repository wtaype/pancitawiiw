// src-tauri/src/nucleo/ventana/ventanas.rs
// Manejo unificado de ventanas nativas: main (Pantalla Completa) y sonrisa (Widget)

use tauri::{Manager, Position, PhysicalPosition};
use std::sync::Mutex;

static FIJAR_SONRISA: Mutex<bool> = Mutex::new(false);

const MARGEN_SMILE_X: i32 = 20;
const MARGEN_SMILE_Y: i32 = 20;

// Helper para redimensionar la ventana principal respetando la barra de tareas de Windows (área útil)
pub fn poner_pantalla_completa(main_window: &tauri::WebviewWindow) {
    let monitor = main_window.current_monitor()
        .ok()
        .flatten()
        .or_else(|| main_window.primary_monitor().ok().flatten());

    if let Some(m) = monitor {
        let scale = main_window.scale_factor().unwrap_or(1.0);
        let monitor_pos = m.position().to_logical::<f64>(scale);
        let monitor_size = m.size().to_logical::<f64>(scale);

        // Restar el margen aproximado de la barra de tareas de Windows para evitar cubrirla
        let alto_util = (monitor_size.height - crate::rii::BARRA_TAREAS_DESCUENTO_PX).max(300.0);

        let _ = main_window.set_position(Position::Logical(tauri::LogicalPosition::new(monitor_pos.x, monitor_pos.y)));
        let _ = main_window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(monitor_size.width, alto_util)));
    }
}

// Helper para garantizar que la sonrisa permanezca en los márgenes internos del monitor activo (sin saltar a la 2da pantalla)
fn posicionar_sonrisa_en_monitor_activo(main_window: &tauri::WebviewWindow, smile_window: &tauri::WebviewWindow) {
    let monitor = main_window.current_monitor()
        .ok()
        .flatten()
        .or_else(|| main_window.primary_monitor().ok().flatten());

    if let Some(m) = monitor {
        let scale = main_window.scale_factor().unwrap_or(1.0);
        let m_pos = m.position();
        let m_size = m.size();

        let smile_w_phys = (crate::rii::SMILE_ANCHO as f64 * scale) as i32;
        let smile_h_phys = (crate::rii::SMILE_ALTO as f64 * scale) as i32;
        let margin_x_phys = (MARGEN_SMILE_X as f64 * scale) as i32;
        let margin_y_phys = (MARGEN_SMILE_Y as f64 * scale) as i32;
        let taskbar_discount_phys = (crate::rii::BARRA_TAREAS_DESCUENTO_PX * scale) as i32;

        // Ubicar en la esquina inferior derecha del monitor activo, sobre la barra de tareas
        let smile_x = m_pos.x + m_size.width as i32 - smile_w_phys - margin_x_phys;
        let smile_y = m_pos.y + m_size.height as i32 - smile_h_phys - margin_y_phys - taskbar_discount_phys;

        let _ = smile_window.set_position(Position::Physical(PhysicalPosition {
            x: smile_x.max(m_pos.x),
            y: smile_y.max(m_pos.y),
        }));
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
        posicionar_sonrisa_en_monitor_activo(&main_window, &smile_window);
        smile_window.show().map_err(|e| e.to_string())?;
        smile_window.unminimize().map_err(|e| e.to_string())?;
        smile_window.set_focus().map_err(|e| e.to_string())?;
        main_window.hide().map_err(|e| e.to_string())?;
    } else {
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
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "No se encontró la ventana principal 'main'".to_string())?;
    let smile_window = app_handle.get_webview_window("smile")
        .ok_or_else(|| "No se encontró la ventana de la sonrisa 'smile'".to_string())?;

    {
        let mut f = FIJAR_SONRISA.lock().unwrap();
        *f = fijar;
    }

    if fijar {
        posicionar_sonrisa_en_monitor_activo(&main_window, &smile_window);
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

    poner_pantalla_completa(&main_window);
    posicionar_sonrisa_en_monitor_activo(&main_window, &smile_window);
    let _ = smile_window.show();

    Ok(())
}

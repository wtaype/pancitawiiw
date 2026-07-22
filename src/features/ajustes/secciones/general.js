// src/features/ajustes/secciones/general.js
// Sub-pestaña Ajustes Generales — Control de Anti-Suspensión Win32 y Carpeta de Chats

import { Mensaje } from '@widev';
import './general.css';

export function arrancar(container) {
  const guardado = localStorage.getItem('wi_anti_suspension') === 'true';

  container.innerHTML = `
    <div class="general_section_wrap">
      <!-- Anti-Suspensión Card -->
      <div class="ajustes_card">
        <h3 class="general_card_title"><i class="fa-solid fa-gears"></i> Configuración General</h3>
        
        <div class="general_setting_row">
          <div class="general_setting_info">
            <span class="general_setting_label">Anti-Suspensión Activa (Win32)</span>
            <span class="general_setting_desc">Mantiene la pantalla encendida y previene que el equipo entre en estado de suspensión (incluso con batería o inactividad).</span>
          </div>
          <div class="apple_switch_container">
            <label class="apple_switch">
              <input type="checkbox" id="ajustes_anti_suspension_toggle" ${guardado ? 'checked' : ''}>
              <span class="apple_switch_slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Exportación de Chats Card -->
      <div class="ajustes_card">
        <h3 class="general_card_title"><i class="fa-solid fa-file-export"></i> Exportación de Chats</h3>
        
        <div class="general_setting_row" style="flex-direction: column; align-items: stretch; gap: 1.5vh; padding: 1vh 0;">
          <div class="general_setting_info">
            <span class="general_setting_label">Carpeta de Destino (Markdown)</span>
            <span class="general_setting_desc">Configura una carpeta para guardar automáticamente tus chats exportados (.md) en silencio.</span>
          </div>
          
          <div class="general_folder_row">
            <input type="text" id="ajustes_chat_export_path" class="general_folder_input" readonly 
              placeholder="Descargas predeterminadas (Carpeta de descargas del usuario)" 
              value="${localStorage.getItem('chatwii_export_path') || ''}" />
            <button id="ajustes_btn_browse_folder" class="general_folder_btn">
              <i class="fa-solid fa-folder-open"></i> Examinar...
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Anti-suspensión Listener
  const toggle = container.querySelector('#ajustes_anti_suspension_toggle');
  toggle?.addEventListener('change', async (e) => {
    const activo = e.target.checked;
    
    // Guardar en localStorage
    localStorage.setItem('wi_anti_suspension', activo ? 'true' : 'false');
    
    // Invocar comando en Rust
    if (window.__TAURI__) {
      try {
        await window.__TAURI__.core.invoke('fijar_estado_suspension', { evitarSuspension: activo });
        Mensaje(
          activo ? '🔌 Modo Anti-Suspensión Activado' : '🔌 Modo Anti-Suspensión Desactivado', 
          'success'
        );
      } catch (err) {
        console.error('[Ajustes] Error al cambiar estado de suspensión en Rust:', err);
        Mensaje('Error al cambiar el estado de energía en Windows.', 'error');
        // Revertir switch
        e.target.checked = !activo;
        localStorage.setItem('wi_anti_suspension', (!activo).toString());
      }
    } else {
      Mensaje(activo ? 'Modo Anti-Suspensión simulación activa.' : 'Modo Anti-Suspensión simulación inactiva.', 'info');
    }
  });

  // Selector de Carpeta Listener
  const btnBrowse = container.querySelector('#ajustes_btn_browse_folder');
  const pathInput = container.querySelector('#ajustes_chat_export_path');

  btnBrowse?.addEventListener('click', async () => {
    if (window.__TAURI__) {
      try {
        const selected = await window.__TAURI__.core.invoke('seleccionar_carpeta_comando', {
          titulo: 'Seleccionar Carpeta para Exportar Chats'
        });
        if (selected) {
          localStorage.setItem('chatwii_export_path', selected);
          if (pathInput) pathInput.value = selected;
          Mensaje('📂 Carpeta de exportación actualizada', 'success');
        }
      } catch (err) {
        console.error('[Ajustes] Error al seleccionar carpeta en Rust:', err);
        Mensaje('Error al abrir el selector de carpetas.', 'error');
      }
    } else {
      // Simulación en desarrollo web
      const mockPath = 'C:\\Simulacion\\Pancitawii-Chats';
      localStorage.setItem('chatwii_export_path', mockPath);
      if (pathInput) pathInput.value = mockPath;
      Mensaje('📂 Simulación: Carpeta de exportación actualizada', 'info');
    }
  });
}

// src/features/ajustes/secciones/general.js
// Sub-pestaña Ajustes Generales — Control de Anti-Suspensión Win32

import { Mensaje } from '@widev';
import './general.css';

export function arrancar(container) {
  const guardado = localStorage.getItem('wi_anti_suspension') === 'true';

  container.innerHTML = `
    <div class="general_section_wrap">
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
    </div>
  `;

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
}

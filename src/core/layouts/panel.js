// src/core/layouts/panel.js
// Layout Panel Flotante Compacto (Estilo Burbuja con Horario a la izq y Reloj a la der)

import state from '../state.js';

export function renderLayoutPanel(root) {
  root.className = 'layout_panel_root';
  root.innerHTML = `
    <div class="layout_panel_shell" data-tauri-drag-region>
      <div class="layout_panel_header" data-tauri-drag-region>
        <span class="panel_title" data-tauri-drag-region>pancitawii · Panel Flotante</span>
        <button id="panel_return_btn" class="panel_ctrl_btn" title="Volver a Vista Principal (o doble clic)">
          <i class="fa-solid fa-compress"></i>
        </button>
      </div>
      <div class="layout_panel_body">
        <div class="panel_col panel_col_horario">
          <h4><i class="fa-solid fa-calendar-days"></i> Horario Hoy</h4>
          <p class="panel_mini_info">08:00 AM - Matemáticas<br>10:00 AM - Recreo / Descanso</p>
        </div>
        <div class="panel_col panel_col_reloj">
          <div class="panel_reloj_display">12:30:45</div>
          <span class="panel_reloj_sub">PM</span>
        </div>
      </div>
    </div>
  `;

  const returnBtn = root.querySelector('#panel_return_btn');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      state.setLayout('principal');
    });
  }
}

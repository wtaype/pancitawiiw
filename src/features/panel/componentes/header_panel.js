// src/features/panel/componentes/header_panel.js
// Header Especial Pro para la ventana nativa Panel (Sin Sidebar, con logo_square.webp y botón de retorno limpio)

import { 
  volverAAppPrincipal, 
  fijarSonrisa, 
  minimizarVentana, 
  alternarMaximarVentana, 
  cerrarVentana 
} from '../lib/controles.js';

export function renderHeaderPanel() {
  return `
    <header class="panel_header" data-tauri-drag-region>
      <div class="panel_header_left" data-tauri-drag-region>
        <div class="panel_logo_box" data-tauri-drag-region>
          <img src="/logo_square.webp" alt="pancitawii Logo" class="panel_logo_img" data-tauri-drag-region onerror="this.onerror=null;this.src='/smile.avif';">
        </div>
        <div class="panel_header_meta" data-tauri-drag-region>
          <span class="panel_header_title" data-tauri-drag-region>pancitawii · Panel de Control</span>
          <span class="panel_header_status" data-tauri-drag-region>
            <span class="pulse_dot"></span>
            Horario & Modo Enfoque
          </span>
        </div>
      </div>

      <div class="panel_header_right">
        <button id="pnl_btn_return" class="panel_win_btn" title="Volver a la Ventana Principal">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <button id="pnl_btn_pin" class="panel_win_btn" title="Fijar Sonrisa Flotante">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
        <div class="panel_win_divider"></div>
        <button id="pnl_btn_min" class="panel_win_btn" title="Minimizar">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button id="pnl_btn_max" class="panel_win_btn" title="Maximizar / Restaurar">
          <i class="fa-regular fa-square"></i>
        </button>
        <button id="pnl_btn_close" class="panel_win_btn close" title="Cerrar Panel">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </header>
  `;
}

export function bindHeaderPanelEvents(container) {
  const btnReturn = container.querySelector('#pnl_btn_return');
  if (btnReturn) btnReturn.addEventListener('click', volverAAppPrincipal);

  const btnPin = container.querySelector('#pnl_btn_pin');
  if (btnPin) btnPin.addEventListener('click', fijarSonrisa);

  const btnMin = container.querySelector('#pnl_btn_min');
  if (btnMin) btnMin.addEventListener('click', minimizarVentana);

  const btnMax = container.querySelector('#pnl_btn_max');
  if (btnMax) btnMax.addEventListener('click', alternarMaximarVentana);

  const btnClose = container.querySelector('#pnl_btn_close');
  if (btnClose) btnClose.addEventListener('click', cerrarVentana);
}

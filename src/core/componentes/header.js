// src/core/componentes/header.js
// Componente Header dinámico adaptado 100% a las clases de app.css (DoctorWii Style)

import { getMeta, rutas } from '../rutas.js';
import state from '../state.js';

export function renderHeader() {
  const meta = getMeta(rutas.rutaActual);

  return `
    <header class="wii_header" data-tauri-drag-region>
      <div class="nv_left" data-tauri-drag-region>
        <div class="wii_header_icon">
          <i class="fa-solid ${meta.icon}"></i>
        </div>
        <div class="wii_header_info" data-tauri-drag-region>
          <span class="wii_header_title" data-tauri-drag-region>${meta.title}</span>
          <span class="wii_header_sub" data-tauri-drag-region>
            <span class="wii_online_dot"></span>
            ${meta.subtitle}
          </span>
        </div>
      </div>

      <div class="nv_right">
        <button id="wii_pin_btn" class="win_btn pin" title="Fijar Sonrisa Flotante">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
        <button id="wii_toggle_panel" class="win_btn" title="Alternar a Vista Panel Flotante">
          <i class="fa-solid fa-expand"></i>
        </button>
        <button id="wii_minimizar" class="win_btn" title="Minimizar">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button id="wii_maximizar" class="win_btn" title="Maximizar">
          <i class="fa-regular fa-square"></i>
        </button>
        <button id="wii_cerrar" class="win_btn close" title="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </header>
  `;
}

export function bindHeaderEvents(container) {
  const pinBtn = container.querySelector('#wii_pin_btn');
  if (pinBtn) {
    pinBtn.addEventListener('click', () => {
      if (window.__TAURI__) {
        const core = window.__TAURI__.core || window.__TAURI__.tauri;
        if (core && typeof core.invoke === 'function') {
          core.invoke('fijar_sonrisa', { fijar: true })
            .catch(err => console.error('Error al fijar sonrisa:', err));
        }
      }
    });
  }

  const toggleBtn = container.querySelector('#wii_toggle_panel');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.togglePanel();
    });
  }
}

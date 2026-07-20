// src/main.js
// Punto de entrada principal SPA de pancitawii

import state from './core/state.js';
import { rutas } from './core/rutas.js';
import { renderLayoutPrincipal } from './core/layouts/principal.js';
import { renderLayoutPanel } from './core/layouts/panel.js';
import wii from './wii.js';

// Cache del objeto ventana de Tauri v2 para evitar búsquedas repetitivas en window
let windowInstance = null;
const getTauriWindow = () => {
  if (windowInstance) return windowInstance;
  if (window.__TAURI__) {
    windowInstance = window.__TAURI__.webviewWindow?.getCurrentWebviewWindow()
                  || window.__TAURI__.window?.getCurrentWindow()
                  || null;
  }
  return windowInstance;
};

// 1. Manejo de arrastre nativo de ventana
document.addEventListener('mousedown', (e) => {
  const dragRegion = e.target.closest('[data-tauri-drag-region]');
  if (dragRegion && !e.target.closest('button, input, textarea, select, a')) {
    getTauriWindow()?.startDragging().catch(() => {});
  }
});

// 2. Control de doble clic para alternar layout
document.addEventListener('dblclick', (e) => {
  if (e.target.closest('[data-tauri-drag-region]') && !e.target.closest('button, input, textarea')) {
    state.toggleLayout();
  }
});

// 3. Manejo de Controles de Ventana (Minimizar, Maximizar, Cerrar)
document.addEventListener('click', (e) => {
  const win = getTauriWindow();
  if (!win) return;

  if (e.target.closest('#wii_minimizar')) {
    win.minimize().catch(console.error);
  } else if (e.target.closest('#wii_maximizar')) {
    win.isMaximized().then(isMax => {
      if (isMax) win.unmaximize();
      else win.maximize();
    }).catch(console.error);
  } else if (e.target.closest('#wii_cerrar')) {
    win.close().catch(console.error);
  }
});

// 4. Inicialización al cargar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  document.title = wii.titulo;

  state.initTema();

  const renderCurrentLayout = (modo) => {
    const root = document.getElementById('appwii');
    if (!root) return;

    if (modo === 'panel') {
      renderLayoutPanel(root);
    } else {
      renderLayoutPrincipal(root);
      rutas.navegar(rutas.rutaActual);
    }
  };

  state.subscribirLayout(renderCurrentLayout);
  renderCurrentLayout(state.layout);
});

// src/app.js
// Punto de entrada principal SPA de pancitawii (Ventana Principal)

import state from './core/state.js';
import { rutas } from './core/rutas.js';
import { renderLayoutPrincipal } from './core/layouts/principal.js';
import wii from './wii.js';

// Cache del objeto ventana de Tauri v2
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

// 2. Manejo de Controles de Ventana (Minimizar, Maximizar, Cerrar)
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
    if (window.__TAURI__) {
      const core = window.__TAURI__.core || window.__TAURI__.tauri;
      core?.invoke('cerrar_aplicacion_completa').catch(() => win.close());
    } else {
      win.close().catch(console.error);
    }
  }
});

// 3. Inicialización al cargar la aplicación principal
document.addEventListener('DOMContentLoaded', () => {
  document.title = wii.titulo;
  state.initTema();

  const root = document.getElementById('appwii');
  if (root) {
    renderLayoutPrincipal(root);
    rutas.navegar(rutas.rutaActual);
  }
});

// 4. Interceptar y abrir enlaces externos en el navegador predeterminado
document.addEventListener('click', async (e) => {
  const anchor = e.target.closest('a');
  if (anchor) {
    const href = anchor.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      if (window.__TAURI__) {
        e.preventDefault();
        try {
          await window.__TAURI__.core.invoke('abrir_url_externa', { url: href });
        } catch (err) {
          console.error('[App] Error al abrir enlace externo:', err);
        }
      }
    }
  }
});

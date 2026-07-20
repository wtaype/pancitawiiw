// src/features/panel/lib/controles.js
// Utilidades de ventana nativa y shortcuts para el Panel pancitawii

export function obtenerTauriCore() {
  if (typeof window !== 'undefined' && window.__TAURI__) {
    return window.__TAURI__.core || window.__TAURI__.tauri || null;
  }
  return null;
}

export function minimizarVentana() {
  if (window.__TAURI__ && window.__TAURI__.window) {
    const win = window.__TAURI__.window.getCurrentWindow();
    win.minimize().catch(console.error);
  }
}

export function alternarMaximarVentana() {
  if (window.__TAURI__ && window.__TAURI__.window) {
    const win = window.__TAURI__.window.getCurrentWindow();
    win.isMaximized().then(max => {
      if (max) {
        win.unmaximize().catch(console.error);
      } else {
        win.maximize().catch(console.error);
      }
    }).catch(console.error);
  }
}

export function cerrarVentana() {
  if (window.__TAURI__ && window.__TAURI__.window) {
    const win = window.__TAURI__.window.getCurrentWindow();
    win.close().catch(console.error);
  }
}

export function volverAAppPrincipal() {
  const core = obtenerTauriCore();
  if (core && typeof core.invoke === 'function') {
    core.invoke('toggle_panel').catch(err => {
      console.error('[controles.js] Error al regresar a app principal:', err);
    });
  }
}

export function fijarSonrisa() {
  const core = obtenerTauriCore();
  if (core && typeof core.invoke === 'function') {
    core.invoke('fijar_sonrisa', { fijar: true }).catch(err => {
      console.error('[controles.js] Error al fijar sonrisa:', err);
    });
  }
}

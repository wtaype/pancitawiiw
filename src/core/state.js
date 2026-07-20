// src/core/state.js
// Estado reactivo global de la aplicación (Tema Central y Comandos de Ventanas Nativas)

import { witema } from '@widev';
import wii from '../wii.js';

function obtenerTemaGuardado() {
  try {
    if (typeof localStorage !== 'undefined') {
      const t = localStorage.getItem('wiTema') || localStorage.getItem('witema');
      if (t) {
        if (t.startsWith('{')) {
          const p = JSON.parse(t);
          return p.value || p;
        }
        return t;
      }
    }
  } catch (e) {}
  return wii.dtema || 'futuro';
}

function invokeTauri(comando, payload = {}) {
  if (window.__TAURI__) {
    const core = window.__TAURI__.core || window.__TAURI__.tauri;
    if (core && typeof core.invoke === 'function') {
      return core.invoke(comando, payload).catch(err => {
        console.error(`[state.js] Error al ejecutar ${comando}:`, err);
      });
    }
  }
  return Promise.resolve();
}

class GlobalState {
  constructor() {
    this.tema = obtenerTemaGuardado();
  }

  // Inicializar tema visual
  initTema() {
    if (document?.documentElement) {
      document.documentElement.dataset.theme = this.tema;
    }
    witema(this.tema);
  }

  // Cambiar tema
  setTema(nuevoTema) {
    this.tema = nuevoTema;
    try {
      localStorage.setItem('wiTema', nuevoTema);
      localStorage.setItem('witema', nuevoTema);
    } catch (e) {}

    if (document?.documentElement) {
      document.documentElement.dataset.theme = nuevoTema;
    }
    witema(nuevoTema);
  }

  // Alternar ventana nativa Panel
  togglePanel() {
    return invokeTauri('toggle_panel');
  }

  // Alternar ventana nativa Smile
  toggleSmile() {
    return invokeTauri('toggle_smile');
  }

  // Fijar sonrisa
  fijarSonrisa(fijar = true) {
    return invokeTauri('fijar_sonrisa', { fijar });
  }

  // Restablecer posiciones de ventanas nativas
  restablecerPosiciones() {
    return invokeTauri('restablecer_posiciones');
  }
}

export const state = new GlobalState();
export default state;

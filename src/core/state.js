// src/core/state.js
// Estado reactivo global de la aplicación (Modo Layout y Tema Central)

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

class GlobalState {
  constructor() {
    this.layout = 'principal'; // 'principal' | 'panel'
    this.tema = obtenerTemaGuardado();
    this.subscriptoresLayout = [];
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

  // Alternar entre Layout Principal y Layout Panel
  toggleLayout() {
    this.layout = this.layout === 'principal' ? 'panel' : 'principal';
    this.notificarLayout();
  }

  // Cambiar layout explícitamente
  setLayout(modo) {
    if (this.layout !== modo) {
      this.layout = modo;
      this.notificarLayout();
    }
  }

  // Suscribirse a cambios de layout
  subscribirLayout(fn) {
    this.subscriptoresLayout.push(fn);
  }

  notificarLayout() {
    this.subscriptoresLayout.forEach(fn => fn(this.layout));
  }
}

export const state = new GlobalState();
export default state;

// src/features/reloj/lib/reloj_db.js
// Repositorio de configuración del módulo Reloj en localStorage (key = 'mireloj')

const KEY_RELOJ = 'mireloj';

const CONFIG_POR_DEFECTO = {
  tabActiva: 'digital',      // 'todos' | 'digital' | 'analogico' | 'hibrido'
  mostrarFecha: true,
  mostrarSegundos: true,
  formato24h: false,
  nombre: 'Pancita'          // Nombre para el saludo personalizado
};

export const relojDB = {
  obtenerConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(KEY_RELOJ);
        if (raw) {
          return { ...CONFIG_POR_DEFECTO, ...JSON.parse(raw) };
        }
      }
    } catch (e) {
      console.error('[RelojDB] Error leyendo configuración:', e);
    }
    return { ...CONFIG_POR_DEFECTO };
  },

  guardarConfig(config) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_RELOJ, JSON.stringify(config));
      }
    } catch (e) {
      console.error('[RelojDB] Error guardando configuración:', e);
    }
  },

  setTab(tab) {
    const cfg = this.obtenerConfig();
    cfg.tabActiva = tab;
    this.guardarConfig(cfg);
  },

  toggleOpcion(clave) {
    const cfg = this.obtenerConfig();
    cfg[clave] = !cfg[clave];
    this.guardarConfig(cfg);
    return cfg[clave];
  }
};

export default relojDB;

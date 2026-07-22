// src/core/widev/tema.js
// tema v11.0: Gestor centralizado y unificado de temas visuales de la aplicación (witema)

import { getls, savels } from './storage.js';
import { Mensaje } from './mensajes.js';
import { Capi } from './texto.js';

const SESSION_KEY = 'doctorii_session';

// Mapa de colores oficiales para meta theme-color
export const witemas = {
  cielo: '#0EBEFF',
  dulce: '#FF5C69',
  paz: '#29C72E',
  oro: '#FFC107',
  mora: '#7000FF',
  futuro: '#21273B'
};

/**
 * Modifica en caliente el tema activo de la aplicación en el DOM, actualiza theme-color
 * y resguarda la preferencia en localStorage de forma consistente como JSON.
 */
export function setTema(name) {
  if (!name) return;
  const color = witemas[name] || '#FFC107';
  
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = name;
    
    // Actualizar meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]') ||
      document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
    meta.content = color;

    // Resaltar visualmente los botones de tema activo (.tema con clase .mtha)
    document.querySelectorAll('.tema').forEach(x => {
      x.classList.toggle('mtha', x.dataset.ths === name);
    });
  }

  // Resguardar en localStorage local como objeto estructurado
  try {
    savels('wiTema', name, null);
  } catch (e) {}
}

/**
 * Inicializa la interactividad de selección de temas
 */
export function witema(dtema) {
  if (typeof document === 'undefined') return;

  const getTheme = () => {
    try {
      return getls('wiTema') || dtema;
    } catch {
      return dtema;
    }
  };

  // Inicializar aplicando el tema activo
  setTema(getTheme());

  // Escuchar clic en los botones de selección de temas (.tema)
  document.addEventListener('click', e => {
    const el = e.target.closest('.tema');
    if (!el) return;
    const name = el.dataset.ths;
    setTema(name);

    // Guardar en la sesión local
    try {
      const u = getls(SESSION_KEY) || {};
      savels(SESSION_KEY, { ...u, tema: name }, 168);
      Mensaje(`Tema ${Capi(name)} guardado!`, 'success');
    } catch (err) {}
  });

  // Escuchar carga de páginas Astro/SPA
  const initTheme = () => {
    setTema(getTheme());
  };
  document.addEventListener('astro:page-load', initTheme);
}

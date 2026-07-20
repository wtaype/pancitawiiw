// src/core/rutas.js
// Enrutador SPA dinámico de pancitawii (Single Source of Truth de navegación)

import { SEO, SEO_DEFAULT } from './seo.js';

// ============================================================
// CONFIGURACIÓN REUTILIZABLE PARA NUEVOS PROYECTOS
// ============================================================
export const RUTA_INICIAL = '/inicio';
export const CONTENEDOR_MAIN_ID = 'wimain';

// ============================================================
// REGISTRO MÍNIMO DE RUTAS Y NAVEGACIÓN
// nav: 'top' (menú superior) | 'bottom' (pie del sidebar) | false (ruta oculta)
// ============================================================
export const RUTAS = [
  { href: '/inicio',  nav: 'top' },
  { href: '/horario', nav: 'top' },
  { href: '/reloj',   nav: 'top' },
  { href: '/chat',    nav: 'top' },
  { href: '/ajustes', nav: 'bottom' },
  { href: '/acerca',  nav: 'bottom' }
];

export const getNavRoutes = (posicion) => RUTAS.filter(r => r.nav === posicion);
export const getMeta = (path) => SEO[path] ?? SEO_DEFAULT;

const AGENTES = RUTAS.map(r => r.href.replace('/', ''));

export const rutas = {
  rutaActual: null,
  cargando: false,

  obtenerAgente(path) {
    const clean = path?.replace(/^\/+|\/+$/g, '').split('#')[0];
    const inicial = RUTA_INICIAL.replace('/', '');
    if (!clean) return inicial;
    return AGENTES.includes(clean) ? clean : inicial;
  },

  async navegar(path) {
    const agente = this.obtenerAgente(path || RUTA_INICIAL);
    const fullPath = `/${agente}`;
    const panel = document.getElementById(CONTENEDOR_MAIN_ID);

    // Evitar recargas duplicadas si ya estamos en la ruta activa ya cargada
    if (this.rutaActual === fullPath && panel && !panel.querySelector('.wi_cargador') && panel.hasChildNodes()) {
      return;
    }

    if (this.cargando) return;
    this.cargando = true;
    this.rutaActual = fullPath;

    // Actualización dinámica automática del Header desde seo.js
    const meta = getMeta(fullPath);
    const headerTitle = document.querySelector('.wii_header_title');
    const headerSub = document.querySelector('.wii_header_sub');
    const headerIcon = document.querySelector('.wii_header_icon i');
    if (headerTitle) headerTitle.textContent = meta.title;
    if (headerSub) headerSub.innerHTML = `<span class="wii_online_dot"></span> ${meta.subtitle}`;
    if (headerIcon) headerIcon.className = `fa-solid ${meta.icon}`;

    if (!panel) {
      this.cargando = false;
      return;
    }

    panel.innerHTML = `
      <div class="wi_cargador">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando ${agente}...
      </div>`;

    try {
      const folder = agente === 'chat' ? 'chatwii' : agente;
      const modulo = await import(`../features/${folder}/${agente}.js`);
      panel.innerHTML = '';
      if (modulo.arrancar) {
        modulo.arrancar(panel);
      }
    } catch (e) {
      console.error(`[Router] Error al cargar módulo '${agente}':`, e);
      panel.innerHTML = `
        <div class="wi_error">
          <i class="fa-solid fa-circle-exclamation"></i>
          <p>Error al cargar el módulo ${agente}.</p>
        </div>`;
    } finally {
      this.cargando = false;
    }
  }
};

export default rutas;

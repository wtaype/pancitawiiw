// src/core/componentes/sidebar.js
// Componente Sidebar (Opción 1: Manipulación directa ultra-limpia en 12 líneas)

import { getNavRoutes, getMeta, rutas } from '../rutas.js';
import { wiTip } from '@widev';
import wii from '../../wii.js';

export function renderSidebar() {
  const isCol = typeof localStorage !== 'undefined' && localStorage.getItem('colapsado') === 'true';

  const renderNavGroup = (posicion) => {
    return getNavRoutes(posicion).map(r => {
      const meta = getMeta(r.href);
      const activeClass = rutas.rutaActual === r.href ? 'active' : '';
      const tipAttrs = isCol ? `data-witip="${meta.tag}" data-wtipo="right"` : '';
      return `
        <button class="nav_btn ${activeClass}" data-path="${r.href}" ${tipAttrs}>
          <i class="fa-solid ${meta.icon}"></i>
          <span>${meta.tag}</span>
        </button>
      `;
    }).join('');
  };

  return `
    <aside id="wii_sidebar" class="${isCol ? 'collapsed' : ''}" data-tauri-drag-region>
      <div class="sidebar_brand" data-tauri-drag-region>
        <img src="/logo_square.webp" alt="Logo" class="brand_logo" data-tauri-drag-region>
        <div class="brand_info" data-tauri-drag-region>
          <span class="brand_title" data-tauri-drag-region>${wii.app}</span>
          <span class="brand_subtitle" data-tauri-drag-region>v${wii.versionName}</span>
        </div>
      </div>
      <nav class="sidebar_nav nav_top">
        ${renderNavGroup('top')}
      </nav>
      <nav class="sidebar_nav nav_bottom">
        ${renderNavGroup('bottom')}
        <button id="btn_colapsar" class="nav_btn btn_colapsar" ${isCol ? 'data-witip="Expandir menú" data-wtipo="right"' : ''}>
          <i class="fa-solid ${isCol ? 'fa-angles-right' : 'fa-angles-left'}"></i>
          <span>${isCol ? 'Expandir' : 'Colapsar'}</span>
        </button>
      </nav>
    </aside>
  `;
}

export function bindSidebarEvents(container) {
  const isColInitial = typeof localStorage !== 'undefined' && localStorage.getItem('colapsado') === 'true';
  if (isColInitial) wiTip();

  // 1. Eventos de navegación normal
  const buttons = container.querySelectorAll('.nav_btn:not(#btn_colapsar)');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-path');
      if (path) {
        container.querySelectorAll('.nav_btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rutas.navegar(path);
      }
    });
  });

  // 2. Acción ultra-limpia de Colapsar / Expandir (Opción 1)
  const btnColapsar = container.querySelector('#btn_colapsar');
  const sidebarEl = container.querySelector('#wii_sidebar');

  if (btnColapsar && sidebarEl) {
    btnColapsar.addEventListener('click', () => {
      sidebarEl.classList.toggle('collapsed');
      const isNowCol = sidebarEl.classList.contains('collapsed');
      
      try {
        localStorage.setItem('colapsado', isNowCol);
      } catch (e) {}

      // Actualizar ícono y texto del botón
      const iconEl = btnColapsar.querySelector('i');
      const spanEl = btnColapsar.querySelector('span');
      if (iconEl) iconEl.className = `fa-solid ${isNowCol ? 'fa-angles-right' : 'fa-angles-left'}`;
      if (spanEl) spanEl.textContent = isNowCol ? 'Expandir' : 'Colapsar';

      // Activar / Desactivar wiTip condicionalmente
      container.querySelectorAll('.nav_btn').forEach(btn => {
        if (isNowCol) {
          const path = btn.getAttribute('data-path');
          const tag = path ? getMeta(path).tag : (btn.id === 'btn_colapsar' ? 'Expandir menú' : '');
          btn.setAttribute('data-witip', tag);
          btn.setAttribute('data-wtipo', 'right');
        } else {
          btn.removeAttribute('data-witip');
          btn.removeAttribute('data-wtipo');
        }
      });

      if (isNowCol) wiTip();
    });
  }
}

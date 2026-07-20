// src/core/componentes/sidebar.js
// Componente Sidebar dinámico dividido en secciones superior e inferior

import { getNavRoutes, getMeta, rutas } from '../rutas.js';
import wii from '../../wii.js';

export function renderSidebar() {
  const renderNavGroup = (posicion) => {
    return getNavRoutes(posicion).map(r => {
      const meta = getMeta(r.href);
      const activeClass = rutas.rutaActual === r.href ? 'active' : '';
      return `
        <button class="nav_btn ${activeClass}" data-path="${r.href}">
          <i class="fa-solid ${meta.icon}"></i>
          <span>${meta.tag}</span>
        </button>
      `;
    }).join('');
  };

  return `
    <aside id="wii_sidebar" data-tauri-drag-region>
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
      </nav>
    </aside>
  `;
}

export function bindSidebarEvents(container) {
  const buttons = container.querySelectorAll('.nav_btn');
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
}

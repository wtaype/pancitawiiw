// src/core/componentes/main.js
// Componente contenedor principal (#wimain) con la navegación horizontal integrada

import { getNavRoutes, rutas } from '@core/rutas.js';
import { getMeta } from '@core/seo.js';

export function renderMainContainer() {
  const leftRoutes = getNavRoutes('left');
  const rightRoutes = getNavRoutes('right');

  let leftHtml = '';
  leftRoutes.forEach(r => {
    const meta = getMeta(r.href);
    const activeClass = (rutas.rutaActual === r.href || (!rutas.rutaActual && r.href === '/inicio')) ? 'active' : '';
    leftHtml += `
      <button class="nav_horizontal_btn ${activeClass}" data-path="${r.href}">
        <i class="fa-solid ${meta.icon}"></i>
        <span>${meta.tag}</span>
      </button>
    `;
  });

  let rightHtml = '';
  rightRoutes.forEach(r => {
    const meta = getMeta(r.href);
    const activeClass = rutas.rutaActual === r.href ? 'active' : '';
    rightHtml += `
      <button class="nav_horizontal_btn ${activeClass}" data-path="${r.href}">
        <i class="fa-solid ${meta.icon}"></i>
        <span>${meta.tag}</span>
      </button>
    `;
  });

  return `
    <main id="wimain" class="wii_main">
      <!-- Navegación horizontal de secciones principales (Glassmorphic Split Layout) -->
      <nav class="main_horizontal_nav">
        <div class="nav_horizontal_left">
          ${leftHtml}
        </div>
        <div class="nav_horizontal_right">
          ${rightHtml}
        </div>
      </nav>

      <!-- Wrapper dinámico de sub-pestañas (tabs.js) -->
      <div id="wimain_tabs_wrapper"></div>

      <!-- Contenedor del contenido activo de la ruta -->
      <div id="wimain_content" class="wimain_content"></div>
    </main>
  `;
}

export function bindMainContainerEvents(container) {
  const navBtns = container.querySelectorAll('.nav_horizontal_btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-path');
      if (path) {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rutas.navegar(path);
      }
    });
  });
}

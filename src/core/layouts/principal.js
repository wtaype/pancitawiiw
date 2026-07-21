// src/core/layouts/principal.js
// Layout Shell Principal (Vista de 2 columnas integrada: Main y Sidebar)

import { renderSidebar, bindSidebarEvents } from '@core/componentes/sidebar.js';
import { renderHeader, bindHeaderEvents } from '@core/componentes/header.js';
import { renderMainContainer, bindMainContainerEvents } from '@core/componentes/main.js';
import './principal.css';

export function renderLayoutPrincipal(root) {
  root.className = 'layout_principal_root';
  root.innerHTML = `
    <div class="layout_principal_shell">
      <div class="wii_content">
        ${renderHeader()}
        <div class="layout_columns_container">
          ${renderMainContainer()}
          ${renderSidebar()}
        </div>
      </div>
    </div>
  `;

  bindSidebarEvents(root);
  bindHeaderEvents(root);
  bindMainContainerEvents(root);
}

// src/core/layouts/principal.js
// Layout Shell Principal (Vista Expandida Completa conectada con app.css)

import { renderSidebar, bindSidebarEvents } from '../componentes/sidebar.js';
import { renderHeader, bindHeaderEvents } from '../componentes/header.js';
import { renderMainContainer } from '../componentes/main.js';

export function renderLayoutPrincipal(root) {
  root.className = 'layout_principal_root';
  root.innerHTML = `
    ${renderSidebar()}
    <div class="wii_content">
      ${renderHeader()}
      ${renderMainContainer()}
    </div>
  `;

  bindSidebarEvents(root);
  bindHeaderEvents(root);
}

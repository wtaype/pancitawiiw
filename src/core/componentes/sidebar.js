// src/core/componentes/sidebar.js
// Columna derecha (Sidebar) que contiene el Reloj Hero, Reproductor de Música y Branding

import { renderReloj, initRelojTimer } from '@features/reloj/reloj.js';
import { renderMusica, bindMusicaEvents } from '@features/musica/musica.js';
import wii from '@wii';

export function renderSidebar() {
  return `
    <aside id="wii_right_sidebar" class="wii_right_sidebar">
      <!-- 1. Reloj Hero -->
      <div id="sidebar_reloj_wrapper" class="sidebar_card_wrapper">
        ${renderReloj()}
      </div>

      <!-- 2. Reproductor de Música -->
      <div id="sidebar_musica_wrapper" class="sidebar_card_wrapper">
        ${renderMusica()}
      </div>
    </aside>
  `;
}

export function bindSidebarEvents(container) {
  // Inicializar temporizadores de reloj
  initRelojTimer(container);
  
  // Vincular eventos de música
  const musicaContainer = container.querySelector('#sidebar_musica_wrapper');
  if (musicaContainer) {
    bindMusicaEvents(musicaContainer);
  }
}

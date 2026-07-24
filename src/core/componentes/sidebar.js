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
  // 1. Inicializar temporizadores de reloj inmediatamente
  initRelojTimer(container);

  // 2. Hidratar eventos de música en segundo plano para 0ms de congelamiento al abrir
  const musicaContainer = container.querySelector('#sidebar_musica_wrapper');
  if (musicaContainer) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => bindMusicaEvents(musicaContainer), { timeout: 100 });
    } else {
      requestAnimationFrame(() => bindMusicaEvents(musicaContainer));
    }
  }
}

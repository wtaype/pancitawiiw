// src/features/panel/panel.js
// Orquestador principal de la ventana nativa Panel (Horario + Reloj)

import { renderHeaderPanel, bindHeaderPanelEvents } from './componentes/header_panel.js';
import { renderReloj, initRelojTimer } from './componentes/reloj.js';
import { renderHorario, bindHorarioEvents } from './componentes/horario.js';
import { volverAAppPrincipal } from './lib/controles.js';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('panel_root');
  if (!root) return;

  // Cargar tema y fuente sincronizados
  const temaGuardado = localStorage.getItem('wiTema') || localStorage.getItem('witema') || 'futuro';
  const fuenteGuardada = localStorage.getItem('wiFont') || 'outfit';
  document.documentElement.setAttribute('data-theme', temaGuardado);
  document.documentElement.setAttribute('data-font', fuenteGuardada);

  // Renderizar la maqueta completa de 2 columnas (Horario a la Izquierda, Reloj a la Derecha)
  root.innerHTML = `
    ${renderHeaderPanel()}
    <main class="panel_body_layout">
      <section class="panel_col_left">
        ${renderHorario()}
      </section>
      <section class="panel_col_right">
        ${renderReloj()}
      </section>
    </main>
  `;

  // Inicializar eventos y temporizadores
  bindHeaderPanelEvents(root);
  const cleanupTimer = initRelojTimer(root);
  bindHorarioEvents(root);

  // Escuchar tecla Escape para volver a la ventana principal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      volverAAppPrincipal();
    }
  });

  // Escuchar cambios de tema en caliente
  window.addEventListener('storage', (e) => {
    if ((e.key === 'wiTema' || e.key === 'witema') && e.newValue) {
      document.documentElement.setAttribute('data-theme', e.newValue);
    }
    if (e.key === 'wiFont' && e.newValue) {
      document.documentElement.setAttribute('data-font', e.newValue);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (typeof cleanupTimer === 'function') cleanupTimer();
  });
});

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

  // Función de refresco suave de horario
  const refrescarHorario = () => {
    const colLeft = root.querySelector('.panel_col_left');
    if (colLeft) {
      colLeft.innerHTML = renderHorario();
      bindHorarioEvents(root);
    }
  };

  // Escuchar tecla Escape para volver a la ventana principal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      volverAAppPrincipal();
    }
  });

  // Escuchar cambios inter-ventanas (storage) y locales (mihorario_update)
  window.addEventListener('storage', (e) => {
    if ((e.key === 'wiTema' || e.key === 'witema') && e.newValue) {
      document.documentElement.setAttribute('data-theme', e.newValue);
    }
    if (e.key === 'wiFont' && e.newValue) {
      document.documentElement.setAttribute('data-font', e.newValue);
    }
    if (e.key === 'mihorario') {
      refrescarHorario();
    }
  });

  window.addEventListener('mihorario_update', () => {
    refrescarHorario();
  });

  // Refrescar automáticamente cada 30s para actualizar minutos restantes en vivo
  const autoRefreshInterval = setInterval(refrescarHorario, 30000);

  window.addEventListener('beforeunload', () => {
    clearInterval(autoRefreshInterval);
    if (typeof cleanupTimer === 'function') cleanupTimer();
  });
});

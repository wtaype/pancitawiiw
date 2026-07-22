// src/features/reloj/reloj.js
// Reloj Hero Neón 12h (Sidebar widget simplificado para evitar redundancias con Inicio)

import '@features/reloj/reloj.css';

export function renderReloj() {
  return `
    <div class="reloj_hero_card sidebar_only_clock">
      <div class="reloj_hero_clock_wrap">
        <div class="reloj_hero_clock" id="panel_hero_live_clock">
          00:00:00 p.m.
        </div>
      </div>
    </div>
  `;
}

export function initRelojTimer(container) {
  const clockEl = container.querySelector('#panel_hero_live_clock');

  function actualizarReloj() {
    const ahora = new Date();
    const hrs24 = ahora.getHours();
    const hrs12 = hrs24 % 12 || 12;
    const mins = String(ahora.getMinutes()).padStart(2, '0');
    const secs = String(ahora.getSeconds()).padStart(2, '0');
    const ampm = hrs24 >= 12 ? 'p.m.' : 'a.m.';

    if (clockEl) {
      clockEl.textContent = `${hrs12}:${mins}:${secs} ${ampm}`;
    }
  }

  actualizarReloj();
  const clockTimerId = setInterval(actualizarReloj, 1000);

  return () => {
    clearInterval(clockTimerId);
  };
}

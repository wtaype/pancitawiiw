// src/features/reloj_sidebar/reloj_sidebar.js
// Reloj Hero Neón 12h (55% de Altura) - Conectado a mensajes_reloj.js en vivo

import { Saludar, fechaHoy, Capi } from '@widev';
import { obtenerAvisosHorarioEnVivo } from '@features/reloj/mensajes_reloj.js';
import '@features/reloj/reloj.css';

export function renderReloj() {
  const hrs = new Date().getHours();
  const iconoSolLuna = hrs >= 6 && hrs < 18 ? 'fa-cloud-sun' : 'fa-moon';
  const saludoLimpio = Saludar().toUpperCase().replace(/,/g, '');
  const saludoTag = `${saludoLimpio}, PANCITA!`;
  const fechaTexto = fechaHoy();
  const avisos = obtenerAvisosHorarioEnVivo();

  return `
    <div class="reloj_hero_card">
      <div class="reloj_hero_top_bar">
        <div class="reloj_welcome_tag">
          <i class="fa-solid fa-sparkles"></i>
          <span id="reloj_saludo_tag">${saludoTag}</span>
        </div>
        <div class="reloj_welcome_icon_box" id="reloj_icon_box">
          <i class="fa-solid ${iconoSolLuna}"></i>
        </div>
      </div>

      <div class="reloj_hero_clock_wrap">
        <div class="reloj_hero_clock" id="panel_hero_live_clock">
          00:00:00 p.m.
        </div>
      </div>

      <div class="reloj_hero_footer">
        <div class="reloj_hero_date">
          <i class="fa-solid fa-calendar-day"></i>
          <span id="reloj_fecha_text">${Capi(fechaTexto)}</span>
        </div>

        <div class="reloj_roles_box" id="reloj_roles_box_container">
          ${renderAvisosHTML(avisos)}
        </div>
      </div>

      <div class="reloj_progress_container">
        <div class="reloj_progress_info">
          <span>Progreso del Día</span>
          <span id="reloj_progress_pct">0%</span>
        </div>
        <div class="reloj_progress_bar">
          <div class="reloj_progress_fill" id="reloj_progress_fill"></div>
        </div>
      </div>
    </div>
  `;
}

function renderAvisosHTML(avisos) {
  return avisos.map((msg, i) => `
    <span class="reloj_role_item ${i === 0 ? 'active' : ''}">${msg}</span>
  `).join('');
}

export function initRelojTimer(container) {
  const clockEl = container.querySelector('#panel_hero_live_clock');
  const pctEl = container.querySelector('#reloj_progress_pct');
  const fillEl = container.querySelector('#reloj_progress_fill');
  const rolesContainer = container.querySelector('#reloj_roles_box_container');

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

    const segundosPasados = (hrs24 * 3600) + (ahora.getMinutes() * 60) + ahora.getSeconds();
    const porcentaje = Math.round((segundosPasados / 86400) * 100);
    if (pctEl) pctEl.textContent = `${porcentaje}%`;
    if (fillEl) fillEl.style.setProperty('--progreso-pct', `${porcentaje}%`);
  }

  // Refrescar lista de avisos dinámicos en vivo
  let roleIdx = 0;
  function rotarMensajes() {
    if (!rolesContainer) return;
    const roleItems = rolesContainer.querySelectorAll('.reloj_role_item');
    if (!roleItems || roleItems.length === 0) return;

    roleItems.forEach(el => el.classList.remove('active'));
    roleIdx = (roleIdx + 1) % roleItems.length;

    // Si dimos la vuelta a la lista, recalcular los avisos de horarioDB
    if (roleIdx === 0) {
      const nuevosAvisos = obtenerAvisosHorarioEnVivo();
      rolesContainer.innerHTML = renderAvisosHTML(nuevosAvisos);
    }

    const nuevosRoleItems = rolesContainer.querySelectorAll('.reloj_role_item');
    if (nuevosRoleItems[roleIdx]) {
      nuevosRoleItems[roleIdx].classList.add('active');
    }
  }

  // Sincronización Reactiva Event-Driven en Barra Lateral (Reloj)
  const handleHorarioUpdate = () => {
    const nuevosAvisos = obtenerAvisosHorarioEnVivo();
    if (rolesContainer) {
      rolesContainer.innerHTML = renderAvisosHTML(nuevosAvisos);
    }
    roleIdx = 0; // Reiniciar rotación al primer mensaje inmediatamente
  };

  window.addEventListener('mihorario_update', handleHorarioUpdate);

  actualizarReloj();
  const clockTimerId = setInterval(actualizarReloj, 1000);
  const rolesTimerId = setInterval(rotarMensajes, 5000);

  return () => {
    clearInterval(clockTimerId);
    clearInterval(rolesTimerId);
    window.removeEventListener('mihorario_update', handleHorarioUpdate);
  };
}

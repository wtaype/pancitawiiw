// src/features/panel/componentes/reloj.js
// Componente de Reloj Hero estilo Inicio (12 horas neón cyan con resplandor y aviso rotativo)

import { Saludar, fechaHoy, Capi } from '@widev';

const MENSAJES_PANCITA = [
  'Recuerda tomar un vaso de agua 💧',
  'En 30 min tienes que descansar 🌙',
  'Enfoque activo en tu materia principal 📚',
  '¡Vas excelente en tus metas hoy! 🏆',
  'Organiza tu horario semanal con Pancita 🎓'
];

export function renderReloj() {
  const hrs = new Date().getHours();
  const iconoSolLuna = hrs >= 6 && hrs < 18 ? 'fa-cloud-sun' : 'fa-moon';
  const saludoTag = `${Saludar().toUpperCase()}, PANCITA!`;
  const fechaTexto = fechaHoy();

  return `
    <div class="reloj_hero_card">
      <!-- Barra Superior (Saludo + Ícono Clima) -->
      <div class="reloj_hero_top_bar">
        <div class="reloj_welcome_tag">
          <span id="reloj_saludo_tag">${saludoTag}</span>
        </div>
        <div class="reloj_welcome_icon_box" id="reloj_icon_box">
          <i class="fa-solid ${iconoSolLuna}"></i>
        </div>
      </div>

      <!-- Tiempo Digital Grande Neón (Estilo Inicio) -->
      <div class="reloj_hero_clock" id="panel_hero_live_clock">
        00:00:00 p.m.
      </div>

      <!-- Barra Inferior (Fecha a la izquierda, Mensaje rotativo a la derecha) -->
      <div class="reloj_hero_footer">
        <div class="reloj_hero_date">
          <i class="fa-solid fa-calendar-day"></i>
          <span id="reloj_fecha_text">${Capi(fechaTexto)}</span>
        </div>

        <div class="reloj_roles_box">
          ${MENSAJES_PANCITA.map((msg, i) => `
            <span class="reloj_role_item ${i === 0 ? 'active' : ''}">${msg}</span>
          `).join('')}
        </div>
      </div>

      <!-- Barra de Progreso del Día -->
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

export function initRelojTimer(container) {
  const clockEl = container.querySelector('#panel_hero_live_clock');
  const pctEl = container.querySelector('#reloj_progress_pct');
  const fillEl = container.querySelector('#reloj_progress_fill');
  const roleItems = container.querySelectorAll('.reloj_role_item');

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

    // Progreso del día en porcentaje (0-100%)
    const segundosPasados = (hrs24 * 3600) + (ahora.getMinutes() * 60) + ahora.getSeconds();
    const porcentaje = Math.round((segundosPasados / 86400) * 100);
    if (pctEl) pctEl.textContent = `${porcentaje}%`;
    if (fillEl) fillEl.style.setProperty('--progreso-pct', `${porcentaje}%`);
  }

  // Rotación de avisos Pancita
  let roleIdx = 0;
  function rotarMensajes() {
    if (!roleItems || roleItems.length === 0) return;
    roleItems.forEach(el => el.classList.remove('active'));
    roleIdx = (roleIdx + 1) % roleItems.length;
    if (roleItems[roleIdx]) {
      roleItems[roleIdx].classList.add('active');
    }
  }

  actualizarReloj();
  const clockTimerId = setInterval(actualizarReloj, 1000);
  const rolesTimerId = setInterval(rotarMensajes, 5000);

  return () => {
    clearInterval(clockTimerId);
    clearInterval(rolesTimerId);
  };
}

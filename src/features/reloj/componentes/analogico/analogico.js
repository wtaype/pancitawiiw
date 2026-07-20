// src/features/reloj/componentes/analogico/analogico.js
// Reloj Analógico — Prefijo "anal_" en todo, data-hand para tick, 0 CSS inline

import { Saludar, fechaHoy, Capi } from '@widev';
import './analogico.css';

function iconoHora(hrs) {
  if (hrs >= 6  && hrs < 12) return 'fa-sun';
  if (hrs >= 12 && hrs < 18) return 'fa-cloud-sun';
  if (hrs >= 18 && hrs < 21) return 'fa-cloud-moon';
  return 'fa-moon';
}

// Posición (x, y) de un número en la esfera (r = radio desde centro 100,100)
function posNum(num, r) {
  const rad = ((num / 12) * 360 - 90) * (Math.PI / 180);
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
}

export function renderAnalogico(config) {
  const {
    mostrarFecha    = true,
    mostrarSegundos = true,
    compacto        = false,
    sinSaludo       = false,
    nombre          = 'Pancita'
  } = config;

  const ahora = new Date();
  const hrs   = ahora.getHours();
  const mins  = ahora.getMinutes();
  const secs  = ahora.getSeconds();

  // Ángulos suavizados
  const secAngle = (secs / 60) * 360;
  const minAngle = ((mins + secs / 60) / 60) * 360;
  const hrAngle  = (((hrs % 12) + mins / 60) / 12) * 360;

  const saludo = Saludar(nombre);
  const fecha  = Capi(fechaHoy());
  const icono  = iconoHora(hrs);

  // ── 60 ticks de minutos ────────────────────────────────────────────────
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const esCuarto = i % 15 === 0;
    const esMayor  = i % 5  === 0;
    const ang  = (i / 60) * 2 * Math.PI;
    const cosA = Math.cos(ang - Math.PI / 2);
    const sinA = Math.sin(ang - Math.PI / 2);
    const r1   = esCuarto ? 83 : esMayor ? 86 : 90;
    const cls  = esCuarto ? 'anal_tick_cuarto' : esMayor ? 'anal_tick_hora' : 'anal_tick_minuto';
    return `<line x1="${(100 + r1 * cosA).toFixed(2)}" y1="${(100 + r1 * sinA).toFixed(2)}" x2="${(100 + 94 * cosA).toFixed(2)}" y2="${(100 + 94 * sinA).toFixed(2)}" class="${cls}"/>`;
  }).join('');

  // ── Números 1-12 ──────────────────────────────────────────────────────
  const numeros = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const { x, y } = posNum(n, compacto ? 70 : 72);
    return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" class="anal_num" dominant-baseline="central" text-anchor="middle">${n}</text>`;
  }).join('');

  // ── Vista Compacta (card "Todos") ─────────────────────────────────────
  if (compacto) {
    return `
      <div class="anal_card_preview">
        <div class="anal_face_card">
          <svg viewBox="0 0 200 200" class="anal_svg">
            <circle cx="100" cy="100" r="95" class="anal_dial"/>
            <circle cx="100" cy="100" r="92" class="anal_dial_inner"/>
            ${ticks}
            ${numeros}
            <line x1="100" y1="100" x2="100" y2="50" class="anal_hand_hour"   data-hand="hour"/>
            <line x1="100" y1="100" x2="100" y2="33" class="anal_hand_minute" data-hand="minute"/>
            ${mostrarSegundos ? `<line x1="100" y1="110" x2="100" y2="25" class="anal_hand_second" data-hand="second"/>` : ''}
            <circle cx="100" cy="100" r="5"   class="anal_pin"/>
            <circle cx="100" cy="100" r="2.5" class="anal_pin_inner"/>
          </svg>
        </div>
        <div class="anal_card_saludo">
          <i class="fa-solid ${icono}"></i>
          <span>${saludo}</span>
        </div>
      </div>
    `;
  }

  // ── Vista Hero Individual ─────────────────────────────────────────────
  return `
    <div class="anal_wrapper rj_fade_in">
      ${!sinSaludo ? `
        <div class="anal_saludo">
          <div class="anal_saludo_icon">
            <i class="fa-solid ${icono}"></i>
          </div>
          <span class="anal_saludo_text">${saludo}</span>
        </div>
      ` : ''}

      <div class="anal_face">
        <svg viewBox="0 0 200 200" class="anal_svg">
          <defs>
            <filter id="anal_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <circle cx="100" cy="100" r="95" class="anal_dial"/>
          <circle cx="100" cy="100" r="92" class="anal_dial_inner"/>
          <circle cx="100" cy="100" r="92" class="anal_dial_ring"/>

          ${ticks}
          ${numeros}

          <!-- Sombras (detrás de manecillas) -->
          <line x1="101" y1="102" x2="101" y2="48" class="anal_shadow_hr"  data-hand="shadow-hour"/>
          <line x1="101" y1="102" x2="101" y2="30" class="anal_shadow_mn"  data-hand="shadow-minute"/>

          <!-- Manecillas -->
          <line x1="100" y1="100" x2="100" y2="48" class="anal_hand_hour"   data-hand="hour"/>
          <line x1="100" y1="100" x2="100" y2="30" class="anal_hand_minute" data-hand="minute"/>
          ${mostrarSegundos ? `
            <line x1="100" y1="114" x2="100" y2="22" class="anal_hand_second" data-hand="second" filter="url(#anal_glow)"/>
          ` : ''}

          <circle cx="100" cy="100" r="6" class="anal_pin"/>
          <circle cx="100" cy="100" r="3" class="anal_pin_inner"/>
        </svg>
      </div>

      ${mostrarFecha ? `
        <div class="anal_fecha">
          <i class="fa-regular fa-calendar-check"></i>
          <span>${fecha}</span>
        </div>
      ` : ''}
    </div>
  `;
}

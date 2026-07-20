// src/features/reloj/componentes/digital/digital.js
// Reloj Digital — Prefijo "dig_" en todo, 0 CSS inline

import { Saludar, fechaHoy, Capi } from '@widev';
import './digital.css';

function iconoHora(hrs) {
  if (hrs >= 6  && hrs < 12) return 'fa-sun';
  if (hrs >= 12 && hrs < 18) return 'fa-cloud-sun';
  if (hrs >= 18 && hrs < 21) return 'fa-cloud-moon';
  return 'fa-moon';
}

export function renderDigital(config) {
  const {
    mostrarFecha   = true,
    mostrarSegundos = true,
    formato24h     = false,
    compacto       = false,
    sinSaludo      = false,
    nombre         = 'Pancita'
  } = config;

  const ahora  = new Date();
  let   horas  = ahora.getHours();
  const mins   = String(ahora.getMinutes()).padStart(2, '0');
  const secs   = String(ahora.getSeconds()).padStart(2, '0');
  const hrs24  = horas;

  let ampm = '';
  if (!formato24h) {
    ampm  = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
  }
  const horasStr = String(horas).padStart(2, '0');
  const saludo   = Saludar(nombre);
  const fecha    = Capi(fechaHoy());
  const icono    = iconoHora(hrs24);

  // ── Vista compacta (card "Todos") ────────────────────────────────────────
  if (compacto) {
    return `
      <div class="dig_card_preview">
        <div class="dig_card_digits">
          <span class="dig_card_hhmm">${horasStr}:${mins}</span>
          ${mostrarSegundos ? `<span class="dig_card_secs">:${secs}</span>` : ''}
          ${!formato24h ? `<span class="dig_card_ampm">${ampm}</span>` : ''}
        </div>
        <div class="dig_card_saludo">
          <i class="fa-solid ${icono}"></i>
          <span>${saludo}</span>
        </div>
      </div>
    `;
  }

  // ── Vista Hero Individual ─────────────────────────────────────────────────
  return `
    <div class="dig_wrapper rj_fade_in">
      ${!sinSaludo ? `
        <div class="dig_saludo">
          <div class="dig_saludo_icon">
            <i class="fa-solid ${icono}"></i>
          </div>
          <span class="dig_saludo_text">${saludo}</span>
        </div>
      ` : ''}

      <div class="dig_display">
        <span class="dig_digits">${horasStr}:${mins}</span>
        ${mostrarSegundos ? `<span class="dig_seconds">:${secs}</span>` : ''}
        ${!formato24h ? `<span class="dig_ampm" id="dig_ampm_val">${ampm}</span>` : ''}
      </div>

      ${mostrarFecha ? `
        <div class="dig_fecha">
          <i class="fa-regular fa-calendar-check"></i>
          <span>${fecha}</span>
        </div>
      ` : ''}
    </div>
  `;
}

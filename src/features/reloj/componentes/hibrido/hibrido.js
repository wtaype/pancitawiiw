// src/features/reloj/componentes/hibrido/hibrido.js
// Reloj Híbrido — Prefijo "hib_", saludo único, analog+digital embebidos, 0 CSS inline

import { Saludar, fechaHoy, Capi } from '@widev';
import { renderAnalogico } from '../analogico/analogico.js';
import { renderDigital }   from '../digital/digital.js';
import './hibrido.css';

function iconoHora(hrs) {
  if (hrs >= 6  && hrs < 12) return 'fa-sun';
  if (hrs >= 12 && hrs < 18) return 'fa-cloud-sun';
  if (hrs >= 18 && hrs < 21) return 'fa-cloud-moon';
  return 'fa-moon';
}

export function renderHibrido(config) {
  const { nombre = 'Pancita', compacto = false } = config;

  const hrs    = new Date().getHours();
  const saludo = Saludar(nombre);
  const fecha  = Capi(fechaHoy());
  const icono  = iconoHora(hrs);

  // ── Vista Compacta (card "Todos") ────────────────────────────────────────
  if (compacto) {
    return `
      <div class="hib_card_preview">
        ${renderAnalogico({ ...config, compacto: true, mostrarFecha: false, sinSaludo: true })}
        ${renderDigital(  { ...config, compacto: true, mostrarFecha: false, sinSaludo: true })}
      </div>
    `;
  }

  // ── Vista Hero Individual ─────────────────────────────────────────────────
  // sinSaludo=true en analog y digital → el saludo va solo arriba
  return `
    <div class="hib_wrapper rj_fade_in">
      <div class="hib_saludo">
        <div class="hib_saludo_icon">
          <i class="fa-solid ${icono}"></i>
        </div>
        <span class="hib_saludo_text">${saludo}</span>
      </div>

      <div class="hib_analog_zone">
        ${renderAnalogico({ ...config, mostrarFecha: false, compacto: false, sinSaludo: true })}
      </div>

      <div class="hib_digital_zone">
        ${renderDigital({ ...config, mostrarFecha: false, compacto: false, sinSaludo: true })}
      </div>

      <div class="hib_fecha">
        <i class="fa-regular fa-calendar-check"></i>
        <span>${fecha}</span>
      </div>
    </div>
  `;
}

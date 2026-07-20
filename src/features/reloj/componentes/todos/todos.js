// src/features/reloj/componentes/todos/todos.js
// Vista "Todos" — Prefijo "tod_", 0 CSS inline, delays por nth-child CSS

import { renderDigital }   from '../digital/digital.js';
import { renderAnalogico } from '../analogico/analogico.js';
import { renderHibrido }   from '../hibrido/hibrido.js';
import './todos.css';

export function renderTodos(config) {
  const cfgCompacto = { ...config, compacto: true };

  return `
    <div class="tod_grid">

      <!-- Tarjeta Digital -->
      <div class="tod_card">
        <div class="tod_card_header">
          <div class="tod_card_icon"><i class="fa-solid fa-display"></i></div>
          <div class="tod_card_title_group">
            <h3 class="tod_card_title">Digital</h3>
            <span class="tod_card_sub">Pantalla LED neón</span>
          </div>
        </div>
        <div class="tod_card_body">
          ${renderDigital(cfgCompacto)}
        </div>
        <div class="tod_card_footer">
          <button class="tod_ampliar_btn" data-goto-tab="digital">
            Expandir <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Tarjeta Analógico -->
      <div class="tod_card">
        <div class="tod_card_header">
          <div class="tod_card_icon"><i class="fa-solid fa-clock"></i></div>
          <div class="tod_card_title_group">
            <h3 class="tod_card_title">Analógico</h3>
            <span class="tod_card_sub">Esfera vectorial SVG</span>
          </div>
        </div>
        <div class="tod_card_body">
          ${renderAnalogico(cfgCompacto)}
        </div>
        <div class="tod_card_footer">
          <button class="tod_ampliar_btn" data-goto-tab="analogico">
            Expandir <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Tarjeta Híbrido -->
      <div class="tod_card">
        <div class="tod_card_header">
          <div class="tod_card_icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="tod_card_title_group">
            <h3 class="tod_card_title">Híbrido</h3>
            <span class="tod_card_sub">Analógico + Digital</span>
          </div>
        </div>
        <div class="tod_card_body">
          ${renderHibrido(cfgCompacto)}
        </div>
        <div class="tod_card_footer">
          <button class="tod_ampliar_btn" data-goto-tab="hibrido">
            Expandir <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

    </div>
  `;
}

// src/features/reloj/reloj.js
// Orquestador — Tick inteligente con data-hand, selectores actualizados, 0 re-render en DOM

import { wiTip } from '@widev';
import { relojDB } from './lib/reloj_db.js';
import { renderDigital }   from './componentes/digital/digital.js';
import { renderAnalogico } from './componentes/analogico/analogico.js';
import { renderHibrido }   from './componentes/hibrido/hibrido.js';
import { renderTodos }     from './componentes/todos/todos.js';
import './reloj.css';

let clockTimer = null;

export function arrancar(container) {
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }

  const renderView = () => {
    const cfg     = relojDB.obtenerConfig();
    const esTodos = cfg.tabActiva === 'todos';

    container.innerHTML = `
      <div class="reloj_container">
        <div class="reloj_toolbar">
          <div class="reloj_tabs">
            <button class="reloj_tab_btn ${cfg.tabActiva === 'todos'     ? 'active' : ''}" data-tab="todos"     data-witip="Ver los tres relojes en tarjetas">
              <i class="fa-solid fa-table-cells-large"></i> Todos
            </button>
            <button class="reloj_tab_btn ${cfg.tabActiva === 'digital'   ? 'active' : ''}" data-tab="digital"   data-witip="Reloj digital neón hero">
              <i class="fa-solid fa-display"></i> Digital
            </button>
            <button class="reloj_tab_btn ${cfg.tabActiva === 'analogico' ? 'active' : ''}" data-tab="analogico" data-witip="Reloj analógico vectorial SVG">
              <i class="fa-solid fa-clock"></i> Analógico
            </button>
            <button class="reloj_tab_btn ${cfg.tabActiva === 'hibrido'   ? 'active' : ''}" data-tab="hibrido"   data-witip="Reloj híbrido: analógico + digital">
              <i class="fa-solid fa-layer-group"></i> Híbrido
            </button>
          </div>

          ${!esTodos ? `
            <div class="reloj_toggles_bar">
              <label class="reloj_toggle_item" data-witip="Mostrar u ocultar la fecha">
                <input type="checkbox" id="chk_fecha"    ${cfg.mostrarFecha    ? 'checked' : ''} />
                <i class="fa-solid fa-calendar-days"></i>
                <span>Fecha</span>
              </label>
              <label class="reloj_toggle_item" data-witip="Mostrar u ocultar los segundos">
                <input type="checkbox" id="chk_segundos" ${cfg.mostrarSegundos ? 'checked' : ''} />
                <i class="fa-solid fa-stopwatch"></i>
                <span>Segundos</span>
              </label>
              <label class="reloj_toggle_item" data-witip="Alternar entre 12h y 24h">
                <input type="checkbox" id="chk_24h"      ${cfg.formato24h      ? 'checked' : ''} />
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>24 Horas</span>
              </label>
            </div>
          ` : ''}
        </div>

        <div class="reloj_display_area${esTodos ? ' modo_todos' : ''}" id="reloj_display_area">
          ${renderTabContent(cfg)}
        </div>
      </div>
    `;

    wiTip();
    bindEventos(container, renderView);
    iniciarTick(container);
  };

  renderView();
}

// ── Tick inteligente — muta solo textContent y atributos SVG ────────────────
function iniciarTick(container) {
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }

  clockTimer = setInterval(() => {
    tickActualizar(container);
  }, 1000);
}

function tickActualizar(container) {
  const ahora  = new Date();
  const hrs24  = ahora.getHours();
  const cfg    = relojDB.obtenerConfig();
  let   horas  = cfg.formato24h ? hrs24 : (hrs24 % 12 || 12);
  const mins   = String(ahora.getMinutes()).padStart(2, '0');
  const secs   = String(ahora.getSeconds()).padStart(2, '0');
  const ampm   = hrs24 >= 12 ? 'PM' : 'AM';
  const horasS = String(horas).padStart(2, '0');

  // ── Digital hero ─────────────────────────────────────────────────────────
  const digDigits = container.querySelector('.dig_digits');
  const digSecs   = container.querySelector('.dig_seconds');
  const digAmpm   = container.querySelector('#dig_ampm_val');
  if (digDigits) digDigits.textContent = `${horasS}:${mins}`;
  if (digSecs)   digSecs.textContent   = `:${secs}`;
  if (digAmpm)   digAmpm.textContent   = ampm;

  // ── Digital compacto (cards Todos) ───────────────────────────────────────
  container.querySelectorAll('.dig_card_hhmm').forEach(el => { el.textContent = `${horasS}:${mins}`; });
  container.querySelectorAll('.dig_card_secs').forEach(el  => { el.textContent = `:${secs}`; });
  container.querySelectorAll('.dig_card_ampm').forEach(el  => { el.textContent = ampm; });

  // ── Analógico — rota manecillas por data-hand (sin re-render, cero jitter) ─
  const secAngle = (ahora.getSeconds() / 60) * 360;
  const minAngle = ((ahora.getMinutes() + ahora.getSeconds() / 60) / 60) * 360;
  const hrAngle  = (((hrs24 % 12) + ahora.getMinutes() / 60) / 12) * 360;

  container.querySelectorAll('[data-hand="hour"]')         .forEach(el => el.setAttribute('transform', `rotate(${hrAngle}  100 100)`));
  container.querySelectorAll('[data-hand="minute"]')       .forEach(el => el.setAttribute('transform', `rotate(${minAngle} 100 100)`));
  container.querySelectorAll('[data-hand="second"]')       .forEach(el => el.setAttribute('transform', `rotate(${secAngle} 100 100)`));
  container.querySelectorAll('[data-hand="shadow-hour"]')  .forEach(el => el.setAttribute('transform', `rotate(${hrAngle}  100 100)`));
  container.querySelectorAll('[data-hand="shadow-minute"]').forEach(el => el.setAttribute('transform', `rotate(${minAngle} 100 100)`));
}

// ── Bindings ────────────────────────────────────────────────────────────────
function bindEventos(container, renderView) {
  // Tabs
  container.querySelectorAll('.reloj_tab_btn').forEach(btn => {
    btn.addEventListener('click', () => {
      relojDB.setTab(btn.getAttribute('data-tab'));
      renderView();
    });
  });

  // Toggles
  const chkFecha    = container.querySelector('#chk_fecha');
  const chkSegundos = container.querySelector('#chk_segundos');
  const chk24h      = container.querySelector('#chk_24h');
  if (chkFecha)    chkFecha.addEventListener('change',    () => { relojDB.toggleOpcion('mostrarFecha');    renderView(); });
  if (chkSegundos) chkSegundos.addEventListener('change', () => { relojDB.toggleOpcion('mostrarSegundos'); renderView(); });
  if (chk24h)      chk24h.addEventListener('change',      () => { relojDB.toggleOpcion('formato24h');      renderView(); });

  // Botones "Expandir" en vista Todos
  container.querySelectorAll('[data-goto-tab]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      relojDB.setTab(btn.getAttribute('data-goto-tab'));
      renderView();
    });
  });
}

// ── Despachador de vistas ────────────────────────────────────────────────────
function renderTabContent(cfg) {
  switch (cfg.tabActiva) {
    case 'todos':     return renderTodos(cfg);
    case 'analogico': return renderAnalogico(cfg);
    case 'hibrido':   return renderHibrido(cfg);
    case 'digital':
    default:          return renderDigital(cfg);
  }
}

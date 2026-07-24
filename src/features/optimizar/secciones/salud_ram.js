// src/features/optimizar/secciones/salud_ram.js
// Sub-Tab de Salud y Memoria RAM con la Estructura de 5 Pilares Deterministas y Persistencia 100% en storage.js

import { obtenerEstadoRam, liberarRamTurbo, escanearBasuraGeneral, vaciarPapeleraNativa, ejecutarLimpieza } from '../lib/api.js';
import { calcularPilaresGenerales, formatearBytes } from '../lib/filtros_optimizar.js';
import { Mensaje, wiSpin, wiTip, savels, getls } from '@widev';
import './salud_ram.css';

export function renderSaludRam(container) {
  let intervalId = null;

  const state = {
    modo: 'optimize',
    puntaje: 100,
    pilaresOK: 5,
    totalPilares: 5,
    bytesBasura: 0,
    ram: null,
    rutasBasura: []
  };

  container.innerHTML = `
    <div class="opt_salud_ram_wrapper">
      <!-- Dashboard de Salud del Sistema (5 Pilares) -->
      <div class="opt_ram_dashboard_card">
        <div class="opt_ram_gauge_container">
          <svg class="opt_ram_svg_circle" width="200" height="200" viewBox="0 0 200 200">
            <circle class="opt_ram_circle_bg" cx="100" cy="100" r="90" />
            <circle id="opt_ram_circle_bar" class="opt_ram_circle_progress" cx="100" cy="100" r="90" />
          </svg>
          <div class="opt_ram_gauge_center">
            <div id="opt_ram_score_num" class="opt_ram_percentage_val">100</div>
            <div id="opt_ram_score_sub" class="opt_ram_health_subtitle">Analizando los 5 pilares del sistema...</div>
          </div>
        </div>

        <!-- Botón de Acción Principal -->
        <button id="opt_btn_xiaomi_main" class="opt_btn_xiaomi_action" data-witip="Ejecutar la optimización integral de los 5 pilares del sistema">
          <i class="fa-solid fa-bolt-lightning"></i> Optimizar Ahora
        </button>
      </div>

      <!-- Cuadrícula de Accesos Rápidos (5 Pilares Esenciales) -->
      <div class="opt_xiaomi_grid">
        <div class="opt_xiaomi_card" data-action="cleaner" data-witip="Limpieza rápida de archivos temporales">
          <div class="opt_xiaomi_card_icon"><i class="fa-solid fa-broom"></i></div>
          <div class="opt_xiaomi_card_content">
            <h4>Limpiador Rápido</h4>
            <p id="opt_grid_cleaner_txt">Archivos temporales</p>
          </div>
        </div>

        <div class="opt_xiaomi_card" data-action="boost" data-witip="Liberar memoria RAM consumida">
          <div class="opt_xiaomi_card_icon"><i class="fa-solid fa-bolt-lightning"></i></div>
          <div class="opt_xiaomi_card_content">
            <h4>Acelerar RAM</h4>
            <p id="opt_grid_ram_txt">Midiendo RAM...</p>
          </div>
        </div>

        <div class="opt_xiaomi_card" data-action="deep" data-witip="Escáner profundo de cachés e historiales">
          <div class="opt_xiaomi_card_icon"><i class="fa-solid fa-user-shield"></i></div>
          <div class="opt_xiaomi_card_content">
            <h4>Limpieza Profunda</h4>
            <p>Con Escudo Anti-Descargas</p>
          </div>
        </div>

        <div class="opt_xiaomi_card" data-action="trash" data-witip="Vaciar la Papelera de Windows de forma nativa">
          <div class="opt_xiaomi_card_icon"><i class="fa-solid fa-trash-can"></i></div>
          <div class="opt_xiaomi_card_content">
            <h4>Papelera de Windows</h4>
            <p>Vaciar instantáneamente</p>
          </div>
        </div>
      </div>
    </div>
  `;

  if (typeof wiTip === 'function') wiTip();

  const circleBar = container.querySelector('#opt_ram_circle_bar');
  const scoreNum = container.querySelector('#opt_ram_score_num');
  const scoreSub = container.querySelector('#opt_ram_score_sub');
  const btnMain = container.querySelector('#opt_btn_xiaomi_main');

  const gridCleanerTxt = container.querySelector('#opt_grid_cleaner_txt');
  const gridRamTxt = container.querySelector('#opt_grid_ram_txt');

  async function cargarEstadoActualDeterminista() {
    try {
      state.ram = await obtenerEstadoRam();
      const resBasura = await escanearBasuraGeneral();
      state.bytesBasura = resBasura?.total_bytes || 0;

      let rutas = [];
      resBasura?.categorias?.forEach(c => {
        if (!c.protegida) rutas = rutas.concat(c.rutas || []);
      });
      state.rutasBasura = rutas;

      // Verificar si hay una optimización reciente guardada en storage.js (< 1 hora)
      const ultOpt = getls('ult_optimizacion');
      const ahora = Date.now();
      const esReciente = ultOpt && ultOpt.fecha && (ahora - ultOpt.fecha < 3600000);

      if (esReciente && state.modo !== 'scan') {
        state.puntaje = 100;
        state.pilaresOK = 5;
        state.modo = 'done';

        const mins = Math.max(1, Math.round((ahora - ultOpt.fecha) / 60000));
        if (scoreSub) {
          scoreSub.textContent = `¡Sistema 100% Optimizado! (Hace ${mins} min)`;
          scoreSub.style.color = '#3cd741';
        }
        if (btnMain) {
          btnMain.className = 'opt_btn_xiaomi_action btn_done_mode';
          btnMain.innerHTML = `<i class="fa-solid fa-circle-check"></i> ¡Sistema 100% Optimizado!`;
        }
      } else {
        // Calcular según los 5 Pilares
        const evaluacion = calcularPilaresGenerales(state.ram, resBasura);
        state.puntaje = evaluacion.puntaje;
        state.pilaresOK = evaluacion.pilaresOK;
        state.modo = 'optimize';

        if (btnMain && state.modo === 'optimize') {
          btnMain.className = 'opt_btn_xiaomi_action';
          btnMain.innerHTML = `<i class="fa-solid fa-bolt-lightning"></i> Optimizar Ahora`;
        }
      }

      actualizarUIEscaneo();
    } catch (e) {
      console.error('[Salud RAM] Error al cargar estado:', e);
    }
  }

  async function ejecutarOptimizacionIntegral() {
    if (typeof wiSpin === 'function') wiSpin(btnMain, true);

    try {
      // 1. Liberar RAM Turbo
      await liberarRamTurbo();

      // 2. Limpiar temporales
      if (state.rutasBasura.length > 0) {
        await ejecutarLimpieza(state.rutasBasura);
      }

      // 3. Vaciar Papelera nativa
      await vaciarPapeleraNativa();

      // 4. Guardar estado 100% en storage.js
      savels('ult_optimizacion', {
        fecha: Date.now(),
        puntaje: 100,
        pilaresLimpios: 5
      }, 720);

      state.puntaje = 100;
      state.pilaresOK = 5;
      state.modo = 'done';
      state.bytesBasura = 0;
      state.ram = await obtenerEstadoRam();

      actualizarUIEscaneo();

      btnMain.className = 'opt_btn_xiaomi_action btn_done_mode';
      btnMain.innerHTML = `<i class="fa-solid fa-circle-check"></i> ¡Sistema 100% Optimizado!`;
      
      Mensaje(`¡Optimización integral completada! Los 5 pilares del sistema han sido purgados.`, 'success');
    } catch (err) {
      console.error('[Optimización Integral] Error:', err);
      Mensaje(`Error al optimizar: ${err}`, 'error');
    } finally {
      if (typeof wiSpin === 'function') wiSpin(btnMain, false);
    }
  }

  function actualizarUIEscaneo() {
    if (scoreNum) scoreNum.textContent = state.puntaje;

    // Actualizar trazo SVG
    const circunferencia = 565.48;
    const offset = circunferencia - (circunferencia * state.puntaje) / 100;
    if (circleBar) {
      circleBar.style.strokeDashoffset = offset;
      circleBar.style.stroke = state.puntaje >= 90 ? '#3cd741' : state.puntaje >= 70 ? '#ffb300' : '#ff3849';
    }

    if (scoreSub) {
      if (state.puntaje >= 90) {
        scoreSub.textContent = '¡Los 5 pilares del sistema están limpios!';
        scoreSub.style.color = '#3cd741';
      } else {
        scoreSub.textContent = `${5 - state.pilaresOK} de 5 pilares requieren optimización`;
        scoreSub.style.color = '#ffb300';
      }
    }

    if (gridCleanerTxt) {
      gridCleanerTxt.textContent = `${formatearBytes(state.bytesBasura)} detectados`;
    }
    if (gridRamTxt && state.ram) {
      gridRamTxt.textContent = `${state.ram.usado_mb} MB usados (${Math.round(state.ram.porcentaje_uso)}%)`;
    }
  }

  let animRamId = null;
  let ultimoTimestampRam = 0;

  function loopSaludRam(timestamp) {
    if (!ultimoTimestampRam || (timestamp - ultimoTimestampRam) >= 60000) {
      ultimoTimestampRam = timestamp;
      cargarEstadoActualDeterminista();
    }
    animRamId = requestAnimationFrame(loopSaludRam);
  }

  cargarEstadoActualDeterminista();
  animRamId = requestAnimationFrame(loopSaludRam);

  if (btnMain) {
    btnMain.onclick = async () => {
      if (state.modo === 'done') {
        // Re-optimizar si el usuario vuelve a hacer clic
        await ejecutarOptimizacionIntegral();
      } else {
        await ejecutarOptimizacionIntegral();
      }
    };
  }

  // Event Listeners para la cuadrícula
  container.querySelectorAll('.opt_xiaomi_card').forEach(card => {
    card.onclick = async () => {
      const action = card.getAttribute('data-action');
      if (action === 'boost') {
        await ejecutarOptimizacionIntegral();
      } else if (action === 'trash') {
        await vaciarPapeleraNativa();
        Mensaje('¡Papelera de Reciclaje vaciada por completo!', 'success');
      } else if (action === 'cleaner') {
        const tabGen = document.querySelector('[data-subtab-id="general"], [data-subtab="general"]');
        if (tabGen) tabGen.click();
      } else if (action === 'deep') {
        const tabProf = document.querySelector('[data-subtab-id="profundo"], [data-subtab="profundo"]');
        if (tabProf) tabProf.click();
      }
    };
  });

  container._cleanupSaludRam = () => {
    if (animRamId) {
      cancelAnimationFrame(animRamId);
      animRamId = null;
    }
  };
}

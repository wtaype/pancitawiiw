// src/features/optimizar/secciones/limpieza_profundo.js
// Sub-Tab Limpieza Profunda con botón Analizar, desgloses colapsados y sin inline styles

import { escanearBasuraProfundo, ejecutarLimpieza } from '../lib/api.js';
import { renderTarjetaCategoria, bindTarjetaCategoriaEvents } from '../componentes/tarjeta_categoria.js';
import { formatearBytes } from '../lib/filtros_optimizar.js';
import { Mensaje, wiSpin, wiConfirmar, wiTip, getls, savels } from '@widev';
import './limpieza_profundo.css';

export function renderLimpiezaProfundo(container) {
  const state = {
    categorias: [],
    seleccionadas: new Set(['pilar_prof_5', 'pilar_prof_6', 'pilar_prof_7', 'pilar_prof_8', 'pilar_prof_9']),
    cargando: false
  };

  container.innerHTML = `
    <div class="opt_limpieza_prof_wrapper">
      <div class="opt_shield_banner">
        <i class="fa-solid fa-shield-halved"></i>
        <div class="opt_shield_banner_text">
          <h4>Escudo Anti-Descargas Activo</h4>
          <p>Las categorías sensibles como tu carpeta de Descargas e historiales vienen desmarcadas por defecto para proteger tus datos importantes.</p>
        </div>
      </div>

      <div class="opt_limpieza_header_card">
        <div class="opt_limpieza_header_info">
          <h3><i class="fa-solid fa-user-shield"></i> Limpieza Profunda de Sistema y Navegadores</h3>
          <p id="opt_prof_summary_txt">Analizando los 10 pilares profundos del sistema...</p>
        </div>
        <div class="opt_header_btn_wrap">
          <button id="opt_btn_analizar_prof" class="opt_btn_papelera_rapida" data-witip="Analizar e inspeccionar la lista exacta de cachés e historiales">
            <i class="fa-solid fa-magnifying-glass"></i> Analizar
          </button>
          <button id="opt_btn_ejecutar_prof" class="opt_btn_ejecutar_limpieza" data-witip="Eliminar cachés seleccionadas de forma profunda">
            <i class="fa-solid fa-broom"></i> Optimizar Seleccionados
          </button>
        </div>
      </div>

      <div id="opt_prof_list_container" class="opt_limpieza_list">
        <div class="dup_empty_state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <h3>Analizando los 10 pilares profundos...</h3>
        </div>
      </div>
    </div>
  `;

  if (typeof wiTip === 'function') wiTip();

  const listContainer = container.querySelector('#opt_prof_list_container');
  const summaryTxt = container.querySelector('#opt_prof_summary_txt');
  const btnAnalizar = container.querySelector('#opt_btn_analizar_prof');
  const btnLimpiar = container.querySelector('#opt_btn_ejecutar_prof');

  async function analizarBasuraProfunda() {
    if (typeof wiSpin === 'function') wiSpin(btnAnalizar, true);

    try {
      state.cargando = true;
      const res = await escanearBasuraProfundo();
      state.categorias = res?.categorias || [];

      state.categorias.forEach(cat => {
        if (!cat.protegida) {
          state.seleccionadas.add(cat.id);
        } else {
          state.seleccionadas.delete(cat.id);
        }
      });

      renderLista();
    } catch (e) {
      console.error('[Limpieza Profunda] Error al escanear:', e);
      if (listContainer) {
        listContainer.innerHTML = `<div class="dup_empty_state"><h3>Error al escanear cachés profundas</h3></div>`;
      }
    } finally {
      state.cargando = false;
      if (typeof wiSpin === 'function') wiSpin(btnAnalizar, false);
    }
  }

  function renderLista() {
    if (!listContainer) return;

    if (state.categorias.length === 0) {
      listContainer.innerHTML = `
        <div class="dup_empty_state">
          <i class="fa-solid fa-circle-check"></i>
          <h3>¡Los 10 pilares profundos están limpios!</h3>
          <p>Los navegadores instalados se encuentran optimizados.</p>
        </div>
      `;
      if (summaryTxt) summaryTxt.textContent = '0 Bytes de caché profunda detectados.';
      return;
    }

    const totalBytes = state.categorias.reduce((acc, c) => acc + c.bytes, 0);
    if (summaryTxt) summaryTxt.textContent = `${formatearBytes(totalBytes)} de cachés detectadas listos para optimizar.`;

    const html = state.categorias
      .map(cat => renderTarjetaCategoria(cat, state.seleccionadas.has(cat.id)))
      .join('');

    listContainer.innerHTML = html;

    bindTarjetaCategoriaEvents(listContainer, (catId, isChecked) => {
      if (isChecked) {
        state.seleccionadas.add(catId);
      } else {
        state.seleccionadas.delete(catId);
      }
    });
  }

  analizarBasuraProfunda();

  if (btnAnalizar) {
    btnAnalizar.onclick = analizarBasuraProfunda;
  }

  if (btnLimpiar) {
    btnLimpiar.onclick = async () => {
      if (state.seleccionadas.size === 0) {
        Mensaje('Selecciona al menos una categoría para limpiar', 'warning');
        return;
      }

      let rutasTotales = [];
      state.categorias.forEach(cat => {
        if (state.seleccionadas.has(cat.id)) {
          rutasTotales = rutasTotales.concat(cat.rutas || []);
        }
      });

      const omitirConfirmacion = getls('opt_skip_confirm');
      if (!omitirConfirmacion) {
        const ok = await wiConfirmar(
          `¿Deseas ejecutar la limpieza profunda de ${rutasTotales.length} archivos de caché seleccionados?`,
          'Confirmar Limpieza Profunda'
        );
        if (!ok) return;

        savels('opt_skip_confirm', true, 720);
      }

      if (typeof wiSpin === 'function') wiSpin(btnLimpiar, true);

      try {
        const liberados = await ejecutarLimpieza(rutasTotales);
        Mensaje(`¡Limpieza profunda completada! ${formatearBytes(liberados)} liberados.`, 'success');
        await analizarBasuraProfunda();
      } catch (err) {
        Mensaje(`Error durante la limpieza profunda: ${err}`, 'error');
      } finally {
        if (typeof wiSpin === 'function') wiSpin(btnLimpiar, false);
      }
    };
  }
}

// src/features/optimizar/secciones/limpieza_general.js
// Sub-Tab Limpieza General con Barra Maestra Marcar Todo y Papelera como Pilar 1 descolapsado por defecto

import { escanearBasuraGeneral, ejecutarLimpieza } from '../lib/api.js';
import { renderTarjetaCategoria, bindTarjetaCategoriaEvents } from '../componentes/tarjeta_categoria.js';
import { formatearBytes } from '../lib/filtros_optimizar.js';
import { Mensaje, wiSpin, wiConfirmar, wiTip, getls, savels } from '@widev';
import './limpieza_general.css';

export function renderLimpiezaGeneral(container) {
  const state = {
    categorias: [],
    seleccionadas: new Set(['pilar_papelera', 'pilar_temp_user', 'pilar_temp_sys', 'pilar_prefetch', 'pilar_apps_logs']),
    cargando: false
  };

  container.innerHTML = `
    <div class="opt_limpieza_gen_wrapper">
      <div class="opt_limpieza_header_card">
        <div class="opt_limpieza_header_info">
          <h3><i class="fa-solid fa-broom"></i> Limpieza de Archivos Temporales</h3>
          <p id="opt_gen_summary_txt">Analizando los 5 pilares temporales del sistema...</p>
        </div>
        <div class="opt_header_btn_wrap">
          <button id="opt_btn_analizar_gen" class="opt_btn_papelera_rapida" data-witip="Analizar e inspeccionar la lista exacta de archivos temporales">
            <i class="fa-solid fa-magnifying-glass"></i> Analizar
          </button>
          <button id="opt_btn_ejecutar_gen" class="opt_btn_ejecutar_limpieza" data-witip="Eliminar archivos temporales seleccionados">
            <i class="fa-solid fa-sparkles"></i> Optimizar Seleccionados
          </button>
        </div>
      </div>

      <!-- Barra Maestra Marcar / Desmarcar Todo -->
      <div class="opt_master_bar">
        <label class="opt_master_left" data-witip="Marcar o desmarcar todos los pilares">
          <input type="checkbox" id="opt_master_chk_gen" class="opt_checkbox_cat" checked />
          <span>Marcar Todo</span>
        </label>
        <div class="opt_master_desc">Inspector de los 5 Pilares Generales del Sistema</div>
        <div class="opt_master_total_size" id="opt_master_size_gen">0 Bytes</div>
      </div>

      <div id="opt_gen_list_container" class="opt_limpieza_list">
        <div class="dup_empty_state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <h3>Analizando los 5 pilares temporales...</h3>
        </div>
      </div>
    </div>
  `;

  if (typeof wiTip === 'function') wiTip();

  const listContainer = container.querySelector('#opt_gen_list_container');
  const summaryTxt = container.querySelector('#opt_gen_summary_txt');
  const btnAnalizar = container.querySelector('#opt_btn_analizar_gen');
  const btnLimpiar = container.querySelector('#opt_btn_ejecutar_gen');
  const masterChk = container.querySelector('#opt_master_chk_gen');
  const masterSizeTxt = container.querySelector('#opt_master_size_gen');

  async function analizarBasuraGeneral() {
    if (typeof wiSpin === 'function') wiSpin(btnAnalizar, true);

    try {
      state.cargando = true;
      const res = await escanearBasuraGeneral();
      state.categorias = res?.categorias || [];

      state.categorias.forEach(cat => {
        if (!cat.protegida) state.seleccionadas.add(cat.id);
      });

      renderLista();
    } catch (e) {
      console.error('[Limpieza General] Error al escanear:', e);
      if (listContainer) {
        listContainer.innerHTML = `<div class="dup_empty_state"><h3>Error al escanear archivos temporales</h3></div>`;
      }
    } finally {
      state.cargando = false;
      if (typeof wiSpin === 'function') wiSpin(btnAnalizar, false);
    }
  }

  function renderLista() {
    if (!listContainer) return;

    const totalBytes = state.categorias.reduce((acc, c) => acc + c.bytes, 0);
    if (summaryTxt) summaryTxt.textContent = `${formatearBytes(totalBytes)} de temporales detectados listos para optimizar.`;
    if (masterSizeTxt) masterSizeTxt.textContent = formatearBytes(totalBytes);

    if (state.categorias.length === 0) {
      listContainer.innerHTML = `
        <div class="dup_empty_state">
          <i class="fa-solid fa-circle-check"></i>
          <h3>¡Los 5 pilares generales están limpios!</h3>
          <p>Tu equipo no tiene archivos basura acumulados en los temporales.</p>
        </div>
      `;
      return;
    }

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

      if (masterChk) {
        masterChk.checked = state.seleccionadas.size === state.categorias.length;
      }
    });
  }

  if (masterChk) {
    masterChk.onchange = () => {
      const checked = masterChk.checked;
      state.categorias.forEach(cat => {
        if (checked) {
          state.seleccionadas.add(cat.id);
        } else {
          state.seleccionadas.delete(cat.id);
        }
      });
      renderLista();
    };
  }

  analizarBasuraGeneral();

  if (btnAnalizar) {
    btnAnalizar.onclick = analizarBasuraGeneral;
  }

  if (btnLimpiar) {
    btnLimpiar.onclick = async () => {
      if (state.seleccionadas.size === 0) {
        Mensaje('Selecciona al menos un pilar o archivo para limpiar', 'warning');
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
          `¿Deseas eliminar permanentemente los ${rutasTotales.length} archivos temporales seleccionados?`,
          'Confirmar Limpieza de Temporales'
        );
        if (!ok) return;

        savels('opt_skip_confirm', true, 720);
      }

      if (typeof wiSpin === 'function') wiSpin(btnLimpiar, true);

      try {
        const liberados = await ejecutarLimpieza(rutasTotales);
        Mensaje(`¡Se eliminaron exitosamente ${formatearBytes(liberados)} de archivos temporales!`, 'success');
        await analizarBasuraGeneral();
      } catch (err) {
        Mensaje(`Error durante la limpieza: ${err}`, 'error');
      } finally {
        if (typeof wiSpin === 'function') wiSpin(btnLimpiar, false);
      }
    };
  }
}

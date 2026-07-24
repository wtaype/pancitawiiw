// src/features/optimizar/componentes/tarjeta_categoria.js
// Componente modular con Checkbox a la izquierda, Papelera descolapsada por defecto e inspección transparente

import { formatearBytes } from '../lib/filtros_optimizar.js';
import { obtenerEstadoInicialCheck } from '../lib/seguridad.js';
import { vaciarPapeleraNativa } from '../lib/api.js';
import { Mensaje, wiTip, wicopy } from '@widev';
import './tarjeta_categoria.css';

export function renderTarjetaCategoria(categoria, estaChecked, onToggleCheck) {
  const checked = estaChecked !== undefined ? estaChecked : obtenerEstadoInicialCheck(categoria);
  const esProtegida = categoria.protegida;
  const esPapelera = categoria.id === 'pilar_papelera';
  const tieneSubitems = (categoria.subitems && categoria.subitems.length > 0) || (esPapelera && categoria.bytes > 0);
  
  // Pilar 1 (Papelera) desplegado por defecto para máxima transparencia
  const descolapsadoPorDefecto = esPapelera;

  const html = `
    <div class="opt_card_categoria_wrapper" data-cat-id="${categoria.id}">
      <div class="opt_card_categoria_header">
        <div class="opt_card_left">
          <input 
            type="checkbox" 
            class="opt_checkbox_cat opt_parent_checkbox" 
            data-cat-id="${categoria.id}" 
            ${checked ? 'checked' : ''} 
            data-witip="${esProtegida ? 'Categoría sensible. Marca solo si deseas vaciar esta carpeta.' : 'Marcar/desmarcar todos los archivos de esta categoría'}"
          />
          <div class="opt_card_icon">
            <i class="fa-solid ${getIconoCategoria(categoria.id)}"></i>
          </div>
          <div class="opt_card_info">
            <h4>
              ${categoria.titulo}
              ${esProtegida ? '<span class="opt_badge_shield" data-witip="Protegido por el Escudo Anti-Descargas (Desmarcado por seguridad)"><i class="fa-solid fa-shield-halved"></i> Protegido</span>' : ''}
            </h4>
            <p>${categoria.descripcion}</p>
          </div>
        </div>

        <div class="opt_card_right">
          <span class="opt_card_size">${formatearBytes(categoria.bytes)}</span>
          ${tieneSubitems ? `<span class="opt_chevron_toggle ${descolapsadoPorDefecto ? 'open' : ''}"><i class="fa-solid fa-chevron-down"></i></span>` : ''}
        </div>
      </div>

      ${tieneSubitems ? `
        <div class="opt_files_tree ${descolapsadoPorDefecto ? '' : 'dup_tab_hidden'}">
          ${(categoria.subitems && categoria.subitems.length > 0) ? categoria.subitems.map(sub => {
            const archivos = sub.archivos || [];
            if (archivos.length === 0) {
              return `
                <div class="opt_subitem_section">
                  <div class="opt_subitem_header">
                    <span class="opt_subitem_title">
                      <i class="fa-solid ${sub.icono}"></i> ${sub.nombre}
                    </span>
                    <span class="opt_subitem_total_size">${formatearBytes(sub.bytes)}</span>
                  </div>
                  <div style="padding: 0.75rem; text-align: center; color: var(--tx2, #a5b4fc); font-size: 0.85rem;">
                    Archivos administrados nativamente por Windows (${formatearBytes(sub.bytes)})
                  </div>
                </div>
              `;
            }

            return `
              <div class="opt_subitem_section">
                <div class="opt_subitem_header">
                  <span class="opt_subitem_title">
                    <i class="fa-solid ${sub.icono}"></i> ${sub.nombre} (${archivos.length} archivos)
                  </span>
                  <span class="opt_subitem_total_size">${formatearBytes(sub.bytes)}</span>
                </div>

                <table class="opt_files_table">
                  <thead>
                    <tr>
                      <th class="opt_col_action">Acción</th>
                      <th>Nombre del Archivo y Ruta Completa</th>
                      <th class="opt_col_size">Tamaño</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${archivos.map(arch => `
                      <tr>
                        <td class="opt_col_action">
                          <input type="checkbox" class="opt_checkbox_cat opt_file_checkbox" data-ruta="${arch.ruta}" ${checked ? 'checked' : ''} />
                        </td>
                        <td>
                          <div class="opt_file_name">${arch.nombre}</div>
                          <div class="opt_file_path_copy" title="${arch.ruta}" data-witip="Clic para copiar ruta completa">
                            <i class="fa-regular fa-copy"></i> ${arch.ruta}
                          </div>
                        </td>
                        <td class="opt_col_size">
                          ${formatearBytes(arch.tamano_bytes)}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('') : `
            <div class="opt_subitem_section" style="text-align: center; padding: 1rem 0;">
              <i class="fa-solid fa-trash-can" style="font-size: 2rem; color: var(--mco, #00f3ff); margin-bottom: 0.5rem;"></i>
              <h4 style="margin: 0; color: var(--tx, #e0e7ff); font-size: 0.95rem;">Papelera de Reciclaje de Windows (${formatearBytes(categoria.bytes)})</h4>
              <p style="margin: 0.35rem 0 1rem 0; font-size: 0.82rem; color: var(--tx2, #a5b4fc);">Elementos pendientes de eliminación permanente en el sistema.</p>
              <button class="opt_btn_papelera_rapida opt_btn_vaciar_pape_inline" style="margin: 0 auto;">
                <i class="fa-solid fa-broom"></i> Vaciar Papelera Nativamente
              </button>
            </div>
          `}
        </div>
      ` : ''}
    </div>
  `;

  return html;
}

export function bindTarjetaCategoriaEvents(container, onToggleCheck) {
  if (typeof wiTip === 'function') wiTip();

  // Acordeón desplegable
  container.querySelectorAll('.opt_card_categoria_header').forEach(header => {
    header.onclick = (e) => {
      if (e.target.closest('input[type="checkbox"]')) return;
      const wrapper = header.closest('.opt_card_categoria_wrapper');
      const tree = wrapper.querySelector('.opt_files_tree');
      const chevron = header.querySelector('.opt_chevron_toggle');
      if (tree) {
        if (tree.classList.contains('dup_tab_hidden')) {
          tree.classList.remove('dup_tab_hidden');
          if (chevron) chevron.classList.add('open');
        } else {
          tree.classList.add('dup_tab_hidden');
          if (chevron) chevron.classList.remove('open');
        }
      }
    };
  });

  // Copiador wicopy para rutas individuales
  container.querySelectorAll('.opt_file_path_copy').forEach(pathEl => {
    pathEl.onclick = (e) => {
      e.stopPropagation();
      const ruta = pathEl.getAttribute('title') || pathEl.textContent.trim();
      if (ruta && typeof wicopy === 'function') {
        wicopy(ruta, pathEl, '¡Ruta copiada!');
      }
    };
  });

  // Botón inline vaciar papelera nativa
  container.querySelectorAll('.opt_btn_vaciar_pape_inline').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      try {
        await vaciarPapeleraNativa();
        Mensaje('¡Papelera de Reciclaje vaciada por completo!', 'success');
        const btnAnalizarGen = document.querySelector('#opt_btn_analizar_gen');
        const btnAnalizarProf = document.querySelector('#opt_btn_analizar_prof');
        if (btnAnalizarGen) btnAnalizarGen.click();
        if (btnAnalizarProf) btnAnalizarProf.click();
      } catch (err) {
        Mensaje(`Error al vaciar papelera: ${err}`, 'error');
      }
    };
  });

  // Checkbox principal (Seleccionar Todo el grupo)
  container.querySelectorAll('.opt_parent_checkbox').forEach(parentChk => {
    parentChk.onchange = () => {
      const catId = parentChk.getAttribute('data-cat-id');
      const wrapper = parentChk.closest('.opt_card_categoria_wrapper');
      wrapper.querySelectorAll('.opt_file_checkbox').forEach(subChk => {
        subChk.checked = parentChk.checked;
      });
      if (typeof onToggleCheck === 'function') {
        onToggleCheck(catId, parentChk.checked);
      }
    };
  });
}

function getIconoCategoria(id) {
  switch (id) {
    case 'pilar_papelera': return 'fa-trash-can';
    case 'pilar_temp_user': return 'fa-folder-open';
    case 'pilar_temp_sys': return 'fa-gears';
    case 'pilar_prefetch': return 'fa-bolt';
    case 'pilar_apps_logs': return 'fa-layer-group';
    case 'pilar_prof_2': return 'fa-folder-open';
    case 'pilar_prof_3': return 'fa-gears';
    case 'pilar_prof_4': return 'fa-bolt';
    case 'pilar_prof_5': return 'fa-chrome';
    case 'pilar_prof_6': return 'fa-edge';
    case 'pilar_prof_7': return 'fa-firefox-browser';
    case 'pilar_prof_8': return 'fa-code';
    case 'pilar_prof_9': return 'fa-cloud';
    case 'pilar_prof_10': return 'fa-download';
    default: return 'fa-broom';
  }
}

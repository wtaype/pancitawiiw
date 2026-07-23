// src/features/duplicados/secciones/resultados_lista.js
// Renderizado de la lista agrupada con muestra de ruta completa, checkboxes Apple iOS y estado vacío limpio

import { formatearBytes } from '../lib/filtros.js';
import { renderPaginacion } from '../componentes/paginacion.js';
import { wiTip, wicopy } from '@widev';
import './resultados_lista.css';

export function renderResultadosLista(
  container, 
  grupos, 
  rutasSeleccionadas, 
  paginaActual = 1,
  tamanoPagina = 20,
  onSeleccionarArchivo, 
  onToggleCheckArchivo,
  onCambiarPagina
) {
  if (!grupos || grupos.length === 0) {
    container.innerHTML = `
      <div class="dup_empty_state">
        <i class="fa-solid fa-circle-check"></i>
        <h3>¡No se encontraron archivos duplicados!</h3>
        <p>Tu disco está perfectamente optimizado o los filtros/búsqueda actuales no coinciden.</p>
      </div>
    `;
    return;
  }

  // Cortar grupos según la página activa
  const inicioIdx = (paginaActual - 1) * tamanoPagina;
  const gruposPagina = grupos.slice(inicioIdx, inicioIdx + tamanoPagina);

  const html = `
    <div class="dup_tab_resultados_wrapper">
      <div class="dup_tab_grupos_accordion">
        ${gruposPagina.map((grupo, gIndex) => renderGrupoItem(grupo, inicioIdx + gIndex, rutasSeleccionadas)).join('')}
      </div>

      <div id="dup_paginacion_container"></div>
    </div>
  `;

  container.innerHTML = html;

  if (typeof wiTip === 'function') wiTip();

  // Renderizar componente de paginación
  const pagContainer = container.querySelector('#dup_paginacion_container');
  if (pagContainer) {
    renderPaginacion(pagContainer, grupos.length, paginaActual, tamanoPagina, onCambiarPagina);
  }

  // Event Listeners para expandir/plegar acordeón
  container.querySelectorAll('.dup_tab_grupo_header').forEach(header => {
    header.onclick = (e) => {
      if (e.target.closest('input[type="checkbox"]')) return;
      const body = header.nextElementSibling;
      const icon = header.querySelector('.dup_chevron i');
      if (body.classList.contains('dup_tab_hidden')) {
        body.classList.remove('dup_tab_hidden');
        icon.className = 'fa-solid fa-chevron-up';
      } else {
        body.classList.add('dup_tab_hidden');
        icon.className = 'fa-solid fa-chevron-down';
      }
    };
  });

  // Event Listeners para clic en item (vista previa temporal en sidebar)
  container.querySelectorAll('.dup_tab_archivo_row').forEach(row => {
    row.onclick = (e) => {
      if (e.target.closest('input[type="checkbox"]') || e.target.closest('.dup_tab_file_path')) return;
      container.querySelectorAll('.dup_tab_archivo_row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      const ruta = row.getAttribute('data-ruta');
      onSeleccionarArchivo(ruta);
    };
  });

  // Event Listeners para Copiar Ruta Completa con wicopy
  container.querySelectorAll('.dup_tab_file_path').forEach(pathEl => {
    pathEl.onclick = (e) => {
      e.stopPropagation();
      const ruta = pathEl.getAttribute('title') || pathEl.textContent.trim();
      if (ruta && typeof wicopy === 'function') {
        wicopy(ruta, pathEl, '¡Ruta copiada!');
      }
    };
  });

  // Event Listeners para Checkbox de selección (Estilo Apple iOS)
  container.querySelectorAll('.dup_checkbox_file').forEach(chk => {
    chk.onchange = () => {
      const ruta = chk.getAttribute('data-ruta');
      onToggleCheckArchivo(ruta, chk.checked);
    };
  });
}

function renderGrupoItem(grupo, gIndex, rutasSeleccionadas) {
  const totalEnGrupo = grupo.archivos.length;

  return `
    <div class="dup_tab_grupo_card">
      <div class="dup_tab_grupo_header">
        <div class="dup_tab_grupo_info">
          <span class="dup_tab_grupo_tag">Grupo #${gIndex + 1}</span>
          <span class="dup_tab_grupo_hash"><i class="fa-solid fa-fingerprint"></i> ${grupo.hash.substring(0, 12)}...</span>
          <span class="dup_tab_grupo_meta">${totalEnGrupo} archivos · ${formatearBytes(grupo.tamano_bytes)} c/u</span>
        </div>
        <div class="dup_tab_grupo_right">
          <span class="dup_tab_badge_waste"><i class="fa-solid fa-trash-can"></i> ${formatearBytes(grupo.bytes_desperdiciados)} desperdiciados</span>
          <span class="dup_chevron"><i class="fa-solid fa-chevron-up"></i></span>
        </div>
      </div>

      <div class="dup_tab_grupo_body">
        <table class="dup_tab_archivos_table">
          <thead>
            <tr>
              <th class="dup_tab_col_action">Acción</th>
              <th>Nombre y Ruta Completa</th>
              <th class="dup_tab_col_mod">Modificado</th>
              <th class="dup_tab_col_size">Tamaño</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.archivos.map((arch, aIndex) => {
              const estaMarcado = rutasSeleccionadas.has(arch.ruta);
              const fechaStr = new Date(arch.fecha_modificacion * 1000).toLocaleDateString();

              return `
                <tr class="dup_tab_archivo_row ${estaMarcado ? 'marked' : ''}" data-ruta="${arch.ruta}">
                  <td class="dup_tab_col_action">
                    <input type="checkbox" class="dup_checkbox_file" data-ruta="${arch.ruta}" ${estaMarcado ? 'checked' : ''} data-witip="Marcar para eliminar" />
                  </td>
                  <td>
                    <div class="dup_tab_file_name_wrap">
                      <i class="fa-solid ${getIconoExtension(arch.extension)}"></i>
                      <div>
                        <div class="dup_tab_file_name">${arch.nombre} ${aIndex === 0 ? '<span class="dup_tab_badge_original">Original</span>' : ''}</div>
                        <div class="dup_tab_file_path" title="${arch.ruta}" data-witip="Clic para copiar ruta completa"><i class="fa-regular fa-copy"></i> ${arch.ruta}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="dup_date">${fechaStr}</span></td>
                  <td><span class="dup_size">${formatearBytes(arch.tamano_bytes)}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getIconoExtension(ext) {
  const e = (ext || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(e)) return 'fa-file-image';
  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(e)) return 'fa-file-video';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(e)) return 'fa-file-audio';
  if (['pdf', 'doc', 'docx', 'txt', 'html'].includes(e)) return 'fa-file-lines';
  return 'fa-file';
}

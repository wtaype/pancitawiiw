// src/features/duplicados/componentes/panel_duplicados.js
// Inspector de vista previa en el sidebar con integración a galeria.js de @widev para imágenes HD y wicopy para copiar rutas

import { obtenerMetadataArchivo } from '../lib/api.js';
import { wiTip, wicopy } from '@widev';
import { abrirGaleria } from '@core/widev/galeria.js';
import './panel_duplicados.css';

export async function renderPanelDuplicados(container, rutaArchivo, onCerrar, onAbrirVisorHD) {
  if (!container) return;

  container.innerHTML = `
    <div class="dup_panel_sidebar_card">
      <button id="dup_panel_btn_close" class="dup_panel_close_btn" data-witip="Cerrar vista previa y volver a la música">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="dup_panel_header">
        <h4><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</h4>
      </div>
    </div>
  `;

  const btnCloseInit = container.querySelector('#dup_panel_btn_close');
  if (btnCloseInit) btnCloseInit.onclick = onCerrar;

  try {
    const meta = await obtenerMetadataArchivo(rutaArchivo);
    if (!meta) {
      if (typeof onCerrar === 'function') onCerrar();
      return;
    }

    const fechaCreacion = meta.fecha_creacion ? new Date(meta.fecha_creacion * 1000).toLocaleString() : 'N/A';
    const fechaModif = meta.fecha_modificacion ? new Date(meta.fecha_modificacion * 1000).toLocaleString() : 'N/A';

    let previewContent = '';
    const assetUrl = window.__TAURI__ ? window.__TAURI__.core.convertFileSrc(meta.ruta) : meta.ruta;

    if (meta.tipo_categoria === 'imagen') {
      previewContent = `
        <div class="dup_panel_media_box">
          <img id="dup_panel_img_thumb" class="dup_galeria_item" src="${assetUrl}" alt="${meta.nombre}" data-witip="Clic para abrir en Galería HD" style="cursor: pointer;" />
        </div>
      `;
    } else if (meta.tipo_categoria === 'video') {
      previewContent = `
        <div class="dup_panel_media_box">
          <video src="${assetUrl}" controls preload="metadata"></video>
        </div>
      `;
    } else if (meta.tipo_categoria === 'audio') {
      previewContent = `
        <div class="dup_panel_media_box audio_box">
          <i class="fa-solid fa-compact-disc fa-3x fa-spin"></i>
          <h4>${meta.nombre}</h4>
          <audio src="${assetUrl}" controls></audio>
        </div>
      `;
    } else {
      previewContent = `
        <div class="dup_panel_media_box document_box">
          <i class="fa-solid fa-file-lines fa-4x"></i>
          <span>Documento / Archivo de sistema</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="dup_panel_sidebar_card">
        <!-- Botón de cierre X en posición absoluta top-right -->
        <button id="dup_panel_btn_close" class="dup_panel_close_btn" data-witip="Cerrar vista previa y volver a la música">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="dup_panel_header">
          <h4><i class="fa-solid fa-circle-info"></i> Vista Previa</h4>
          <span class="dup_panel_badge_type">${meta.tipo_categoria}</span>
        </div>

        ${previewContent}

        <div class="dup_panel_details">
          <div class="dup_panel_detail_item">
            <label>Nombre:</label>
            <span class="dup_panel_detail_val bold" title="${meta.nombre}">${meta.nombre}</span>
          </div>
          <div class="dup_panel_detail_item">
            <label>Tamaño:</label>
            <span class="dup_panel_detail_val highlight">${meta.tamano_legible}</span>
          </div>
          <div class="dup_panel_detail_item">
            <label>Extensión:</label>
            <span class="dup_panel_detail_val">.${meta.extension}</span>
          </div>
          <div class="dup_panel_detail_item">
            <label>Modificado:</label>
            <span class="dup_panel_detail_val">${fechaModif}</span>
          </div>
          <div class="dup_panel_detail_item">
            <label>Creación:</label>
            <span class="dup_panel_detail_val">${fechaCreacion}</span>
          </div>
          <div class="dup_panel_detail_item full_width">
            <label>Ruta Completa (Clic para copiar):</label>
            <span id="dup_panel_path_copy" class="dup_panel_detail_val path_box" title="${meta.ruta}" data-witip="Clic para copiar ruta completa">
              <i class="fa-regular fa-copy"></i> ${meta.ruta}
            </span>
          </div>
        </div>

        <div class="dup_panel_actions">
          <button id="dup_panel_btn_abrir_hd" class="dup_panel_btn_hd" data-witip="Abrir visor modal en pantalla completa">
            <i class="fa-solid fa-expand"></i> Ver en Galería HD
          </button>
        </div>
      </div>
    `;

    if (typeof wiTip === 'function') wiTip();

    const btnClose = container.querySelector('#dup_panel_btn_close');
    if (btnClose) btnClose.onclick = onCerrar;

    const pathCopyEl = container.querySelector('#dup_panel_path_copy');
    if (pathCopyEl) {
      pathCopyEl.onclick = () => {
        if (typeof wicopy === 'function') {
          wicopy(meta.ruta, pathCopyEl, '¡Ruta copiada!');
        }
      };
    }

    // Fase 3: Integración de galeria.js para imágenes
    const thumbImg = container.querySelector('#dup_panel_img_thumb');
    if (thumbImg) {
      thumbImg.onclick = () => {
        if (typeof abrirGaleria === 'function') {
          abrirGaleria(thumbImg, '.dup_galeria_item', meta.nombre);
        } else {
          onAbrirVisorHD(meta);
        }
      };
    }

    const btnHD = container.querySelector('#dup_panel_btn_abrir_hd');
    if (btnHD) {
      btnHD.onclick = () => {
        if (meta.tipo_categoria === 'imagen' && typeof abrirGaleria === 'function' && thumbImg) {
          abrirGaleria(thumbImg, '.dup_galeria_item', meta.nombre);
        } else {
          onAbrirVisorHD(meta);
        }
      };
    }
  } catch (e) {
    if (typeof onCerrar === 'function') onCerrar();
  }
}

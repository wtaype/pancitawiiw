// src/features/duplicados/secciones/preview_lateral.js
// Panel lateral fijo de vista previa rápida y metadatos de archivos seleccionados

import { obtenerMetadataArchivo } from '../lib/api.js';
import './preview_lateral.css';

export async function renderPreviewLateral(container, rutaArchivo, onAbrirVisorHD) {
  if (!rutaArchivo) {
    container.innerHTML = `
      <div class="dup_tab_preview_empty">
        <i class="fa-solid fa-hand-pointer"></i>
        <p>Haz clic en cualquier archivo de la lista para ver sus detalles y vista previa aquí.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="dup_tab_preview_empty">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Cargando vista previa...</p>
    </div>
  `;

  try {
    const meta = await obtenerMetadataArchivo(rutaArchivo);
    if (!meta) {
      container.innerHTML = `<div class="dup_tab_preview_empty"><p>No se pudo obtener metadatos.</p></div>`;
      return;
    }

    const fechaCreacion = meta.fecha_creacion ? new Date(meta.fecha_creacion * 1000).toLocaleString() : 'N/A';
    const fechaModif = meta.fecha_modificacion ? new Date(meta.fecha_modificacion * 1000).toLocaleString() : 'N/A';

    let previewContent = '';
    const assetUrl = window.__TAURI__ ? window.__TAURI__.core.convertFileSrc(meta.ruta) : meta.ruta;

    if (meta.tipo_categoria === 'imagen') {
      previewContent = `
        <div class="dup_tab_preview_media_box">
          <img src="${assetUrl}" alt="${meta.nombre}" loading="lazy" />
        </div>
      `;
    } else if (meta.tipo_categoria === 'video') {
      previewContent = `
        <div class="dup_tab_preview_media_box">
          <video src="${assetUrl}" controls preload="metadata"></video>
        </div>
      `;
    } else if (meta.tipo_categoria === 'audio') {
      previewContent = `
        <div class="dup_tab_preview_media_box audio_box">
          <i class="fa-solid fa-music fa-3x"></i>
          <audio src="${assetUrl}" controls></audio>
        </div>
      `;
    } else {
      previewContent = `
        <div class="dup_tab_preview_media_box document_box">
          <i class="fa-solid fa-file-lines fa-4x"></i>
          <span>Documento / Archivo de sistema</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="dup_tab_preview_card">
        <div class="dup_tab_preview_header">
          <h4><i class="fa-solid fa-circle-info"></i> Vista Previa</h4>
          <span class="dup_tab_preview_badge_type">${meta.tipo_categoria}</span>
        </div>

        ${previewContent}

        <div class="dup_tab_preview_details">
          <div class="dup_tab_detail_item">
            <label>Nombre:</label>
            <span class="dup_tab_detail_val bold" title="${meta.nombre}">${meta.nombre}</span>
          </div>
          <div class="dup_tab_detail_item">
            <label>Tamaño:</label>
            <span class="dup_tab_detail_val highlight">${meta.tamano_legible}</span>
          </div>
          <div class="dup_tab_detail_item">
            <label>Extensión:</label>
            <span class="dup_tab_detail_val">.${meta.extension}</span>
          </div>
          <div class="dup_tab_detail_item">
            <label>Modificado:</label>
            <span class="dup_tab_detail_val">${fechaModif}</span>
          </div>
          <div class="dup_tab_detail_item">
            <label>Creación:</label>
            <span class="dup_tab_detail_val">${fechaCreacion}</span>
          </div>
          <div class="dup_tab_detail_item full_width">
            <label>Ruta Completa:</label>
            <span class="dup_tab_detail_val path_box" title="${meta.ruta}">${meta.ruta}</span>
          </div>
        </div>

        <div class="dup_tab_preview_actions">
          <button id="dup_tab_btn_abrir_hd" class="dup_tab_btn_hd">
            <i class="fa-solid fa-expand"></i> Ver en Modal HD (Pantalla Completa)
          </button>
        </div>
      </div>
    `;

    const btnHD = container.querySelector('#dup_tab_btn_abrir_hd');
    if (btnHD) {
      btnHD.onclick = () => onAbrirVisorHD(meta);
    }
  } catch (e) {
    container.innerHTML = `<div class="dup_tab_preview_empty"><p>Error al cargar vista previa: ${e}</p></div>`;
  }
}

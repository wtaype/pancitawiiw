// src/features/duplicados/componentes/modal_visor_hd.js
// Visor modal HD multimedia a pantalla completa para fotos, videos y audios

import { wiTip } from '@widev';
import './modal_visor_hd.css';

export function renderModalVisorHD(meta, onCerrar) {
  // Eliminar cualquier modal previo si existiera
  const antiguo = document.getElementById('dup_modal_hd_root');
  if (antiguo) antiguo.remove();

  const assetUrl = window.__TAURI__ ? window.__TAURI__.core.convertFileSrc(meta.ruta) : meta.ruta;

  let bodyMedia = '';
  if (meta.tipo_categoria === 'imagen') {
    bodyMedia = `
      <div class="dup_hd_media_wrapper">
        <img src="${assetUrl}" alt="${meta.nombre}" />
      </div>
    `;
  } else if (meta.tipo_categoria === 'video') {
    bodyMedia = `
      <div class="dup_hd_media_wrapper">
        <video src="${assetUrl}" controls autoplay preload="auto"></video>
      </div>
    `;
  } else if (meta.tipo_categoria === 'audio') {
    bodyMedia = `
      <div class="dup_hd_media_wrapper">
        <div class="dup_hd_audio_box">
          <i class="fa-solid fa-compact-disc fa-5x fa-spin"></i>
          <h4>${meta.nombre}</h4>
          <audio src="${assetUrl}" controls autoplay></audio>
        </div>
      </div>
    `;
  } else {
    bodyMedia = `
      <div class="dup_hd_media_wrapper">
        <div class="dup_hd_audio_box">
          <i class="fa-solid fa-file-lines fa-5x"></i>
          <h4>${meta.nombre}</h4>
          <p>Vista previa en texto no disponible para este tipo de archivo.</p>
        </div>
      </div>
    `;
  }

  const modalHtml = `
    <div id="dup_modal_hd_root" class="dup_hd_modal_overlay active">
      <div class="dup_hd_modal_card">
        <div class="dup_hd_modal_header">
          <div class="dup_hd_modal_title">
            <i class="fa-solid fa-expand"></i>
            <h3 title="${meta.nombre}">${meta.nombre}</h3>
          </div>
          <button id="dup_btn_close_hd" class="dup_hd_modal_close" data-witip="Cerrar vista previa HD">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="dup_hd_modal_body">
          ${bodyMedia}
        </div>

        <div class="dup_hd_footer">
          <span class="dup_hd_footer_path" title="${meta.ruta}">${meta.ruta}</span>
          <span class="dup_hd_footer_meta">${meta.tamano_legible}</span>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  if (typeof wiTip === 'function') wiTip();

  const modalRoot = document.getElementById('dup_modal_hd_root');
  const btnClose = document.getElementById('dup_btn_close_hd');

  const cerrar = () => {
    if (modalRoot) {
      modalRoot.classList.remove('active');
      setTimeout(() => modalRoot.remove(), 250);
    }
    if (typeof onCerrar === 'function') onCerrar();
  };

  if (btnClose) btnClose.onclick = cerrar;

  modalRoot.onclick = (e) => {
    if (e.target === modalRoot) cerrar();
  };

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      cerrar();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

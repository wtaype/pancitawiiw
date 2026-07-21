// src/features/musica/componentes/musica_modales.js
// Modal de gestión de música con Tabs y Escaneo Instantáneo (Cero Botones Innecesarios)

import { abrirModal, cerrarModal } from '@core/widev/modales.js';
import { wiTip } from '@core/widev/witip.js';

export function renderModalMusicaHTML(carpetasGuardadas = [], carpetaActivaId = '') {
  return `
    <div class="wiModal" id="modal_musica" tabIndex="-1">
      <div class="modalBody msc_modal_glass_wide">
        <button class="modalX" data-wimodal-close data-witip="Cerrar (Esc)" data-wtipo="top">&times;</button>

        <!-- Cabecera con Pestañas -->
        <div class="msc_modal_header_tabs">
          <div class="msc_modal_tab_btn active" data-mtab="nueva">
            <i class="fa-solid fa-folder-plus"></i> Seleccionar carpeta nueva
          </div>
          <div class="msc_modal_tab_btn" data-mtab="mis_carpetas">
            <i class="fa-solid fa-folder-tree"></i> Mis carpetas
            <span class="msc_badge_count" id="msc_badge_folders">${carpetasGuardadas.length || 1}</span>
          </div>
        </div>

        <!-- Contenido de Pestaña 1: Nueva Carpeta -->
        <div class="msc_modal_tab_content active" id="msc_mtab_nueva">
          <div class="msc_dropzone_instant" id="msc_dropzone_instant">
            <i class="fa-solid fa-folder-open msc_dropzone_icon"></i>
            <span class="msc_dropzone_title">Haz clic para seleccionar una carpeta</span>
            <span class="msc_dropzone_sub">Se escaneará y activará automáticamente sin clics extra</span>
            <span class="msc_dropzone_formats">Formatos: .mp3, .wav, .flac, .ogg, .m4a</span>
            <input type="file" id="msc_file_input_directory" webkitdirectory directory multiple class="msc_file_input_hidden" />
          </div>
        </div>

        <!-- Contenido de Pestaña 2: Mis Carpetas -->
        <div class="msc_modal_tab_content" id="msc_mtab_mis_carpetas">
          <div class="msc_folders_list" id="msc_folders_list">
            ${renderMisCarpetasHTML(carpetasGuardadas, carpetaActivaId)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderMisCarpetasHTML(carpetas, activaId) {
  if (!carpetas || carpetas.length === 0) {
    return `<div class="msc_empty_folders">
      <i class="fa-solid fa-folder-open"></i>
      <span>No hay carpetas guardadas aún</span>
    </div>`;
  }

  return carpetas.map((c) => {
    const esActiva = c.id === activaId || c.activa;
    return `
      <div class="msc_folder_item_card ${esActiva ? 'active' : ''}" data-folder-id="${c.id}">
        <div class="msc_folder_item_info">
          <div class="msc_folder_icon_box">
            <i class="fa-solid ${esActiva ? 'fa-folder-open' : 'fa-folder'}"></i>
          </div>
          <div class="msc_folder_details">
            <div class="msc_folder_name_row">
              <span class="msc_folder_name">${c.nombre}</span>
              ${esActiva ? '<span class="msc_tag_active">Activa</span>' : ''}
            </div>
            <span class="msc_folder_sub">${c.canciones?.length || 0} canciones · ${c.fecha || 'Reciente'}</span>
          </div>
        </div>
        <div class="msc_folder_actions">
          ${!esActiva ? `
            <button class="msc_folder_act_btn activate" data-action="activar" data-folder-id="${c.id}" data-witip="Activar carpeta" data-wtipo="top">
              <i class="fa-solid fa-play"></i> Activar
            </button>
          ` : ''}
          <button class="msc_folder_act_btn delete" data-action="eliminar" data-folder-id="${c.id}" data-witip="Eliminar de la lista" data-wtipo="top">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function asegurarModalEnBody(carpetas, activaId, callbacks) {
  if (typeof document === 'undefined') return;

  let modalEl = document.getElementById('modal_musica');
  if (!modalEl) {
    const div = document.createElement('div');
    div.innerHTML = renderModalMusicaHTML(carpetas, activaId);
    modalEl = div.firstElementChild;
    document.body.appendChild(modalEl);
  }

  bindModalMusicaEvents(modalEl, callbacks);
}

export function bindModalMusicaEvents(modalEl, { onSeleccionarNuevaCarpeta, onActivarCarpeta, onEliminarCarpeta }) {
  wiTip();

  // Cambios de Pestaña dentro del Modal
  const tabBtns = modalEl.querySelectorAll('.msc_modal_tab_btn');
  const tabContents = modalEl.querySelectorAll('.msc_modal_tab_content');

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const tabTarget = btn.dataset.mtab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = modalEl.querySelector(`#msc_mtab_${tabTarget}`);
      if (targetEl) targetEl.classList.add('active');
    };
  });

  // Pestaña 1: Dropzone y Escaneo Instantáneo con Backend Rust
  const dropzone  = modalEl.querySelector('#msc_dropzone_instant');
  const fileInput = modalEl.querySelector('#msc_file_input_directory');

  if (dropzone) {
    dropzone.onclick = async () => {
      // Intentar selector nativo de Windows vía Rust Tauri
      if (typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)) {
        try {
          const { invoke } = window.__TAURI__.core || window.__TAURI__.tauri;
          const respuesta = await invoke('seleccionar_carpeta_musica_comando');
          if (respuesta && respuesta.canciones && respuesta.canciones.length > 0) {
            if (typeof onSeleccionarNuevaCarpeta === 'function') {
              onSeleccionarNuevaCarpeta(respuesta.canciones, respuesta.carpeta_nombre || 'Carpeta Importada');
            }
            cerrarModal('modal_musica');
            wiTip(document.body, `Carpeta "${respuesta.carpeta_nombre}" activada (${respuesta.canciones.length} canciones)`, 'top', 2000);
            return;
          }
        } catch (err) {
          console.warn('Uso de selector Rust falló o fue cancelado:', err);
        }
      }

      // Fallback a HTML5 web
      if (fileInput) fileInput.click();
    };

    if (fileInput) {
      fileInput.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        const extValidas = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];
        const audioFiles = files.filter(f => extValidas.some(ext => f.name.toLowerCase().endsWith(ext)));

        if (audioFiles.length > 0) {
          const primerPath = audioFiles[0].webkitRelativePath || audioFiles[0].name;
          const carpetaNombre = primerPath.split('/')[0] || 'Carpeta Importada';

          const canciones = audioFiles.map((file, i) => {
            const pesoMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
            const fechaMod = new Date(file.lastModified).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
            const objectUrl = URL.createObjectURL(file);

            return {
              id: i + 1,
              titulo: file.name.replace(/\.[^/.]+$/, ""),
              archivo: file.name,
              peso: pesoMB,
              fecha: fechaMod,
              url: objectUrl,
              relativePath: file.webkitRelativePath || file.name
            };
          });

          if (typeof onSeleccionarNuevaCarpeta === 'function') {
            onSeleccionarNuevaCarpeta(canciones, carpetaNombre);
          }
          cerrarModal('modal_musica');
          wiTip(document.body, `Carpeta "${carpetaNombre}" activada (${canciones.length} canciones)`, 'top', 2000);
        }
      };
    }
  }

  // Pestaña 2: Acciones en Mis Carpetas (Activar / Eliminar)
  const foldersList = modalEl.querySelector('#msc_folders_list');
  if (foldersList) {
    foldersList.onclick = (e) => {
      const btn = e.target.closest('.msc_folder_act_btn');
      if (!btn) return;

      const action = btn.dataset.action;
      const folderId = btn.dataset.folderId;

      if (action === 'activar' && typeof onActivarCarpeta === 'function') {
        onActivarCarpeta(folderId);
        cerrarModal('modal_musica');
      } else if (action === 'eliminar' && typeof onEliminarCarpeta === 'function') {
        onEliminarCarpeta(folderId);
      }
    };
  }
}

export function abrirModalMusica(carpetas, activaId, callbacks) {
  // Asegurar que el modal esté en el body con datos frescos
  let modalEl = document.getElementById('modal_musica');
  if (modalEl) modalEl.remove(); // Re-render con lista fresca

  const div = document.createElement('div');
  div.innerHTML = renderModalMusicaHTML(carpetas, activaId);
  modalEl = div.firstElementChild;
  document.body.appendChild(modalEl);

  bindModalMusicaEvents(modalEl, callbacks);
  abrirModal('modal_musica');
}

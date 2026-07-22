// src/features/musica/componentes/ruta_local.js
// Subcomponente: Administración de Carpetas de Música Local

import { wiTip } from '@core/widev/witip.js';

export function renderRutaLocalHTML(carpetasGuardadas = [], carpetaActivaId = '', combinarTodas = false) {
  return `
    <div class="msc_subpanel_title">
      <i class="fa-solid fa-folder-tree"></i> Carpetas de Música Local
    </div>
    
    <!-- Sección de Dropzone de Escaneo -->
    <div class="msc_dropzone_instant" id="msc_dropzone_instant">
      <i class="fa-solid fa-folder-open msc_dropzone_icon"></i>
      <span class="msc_dropzone_title">Haz clic para seleccionar una carpeta</span>
      <span class="msc_dropzone_sub">Se escaneará y activará automáticamente sin clics extra</span>
      <span class="msc_dropzone_formats">Formatos: .mp3, .wav, .flac, .ogg, .m4a</span>
      <input type="file" id="msc_file_input_directory" webkitdirectory directory multiple class="msc_file_input_hidden" />
    </div>

    <!-- Lista de carpetas guardadas -->
    <div class="msc_folders_list_wrap">
      <span class="msc_folders_list_title">Directorios Agregados</span>
      <div class="msc_folders_list" id="msc_folders_list">
        ${renderMisCarpetasHTML(carpetasGuardadas, carpetaActivaId, combinarTodas)}
      </div>
    </div>
  `;
}

export function renderMisCarpetasHTML(carpetas = [], activaId = '', combinarTodas = false) {
  if (!carpetas || carpetas.length === 0) {
    return `
      <div class="msc_empty_folders">
        <i class="fa-solid fa-folder-open"></i>
        <span>No hay carpetas guardadas aún</span>
      </div>
    `;
  }

  return carpetas.map((c) => {
    const esActiva = !combinarTodas && (c.id === activaId || c.activa);
    return `
      <div class="msc_folder_item_card ${esActiva ? 'active' : ''} ${combinarTodas ? 'combined_mode' : ''}" data-folder-id="${c.id}">
        <div class="msc_folder_item_info">
          <div class="msc_folder_icon_box">
            <i class="fa-solid ${esActiva ? 'fa-folder-open' : 'fa-folder'}"></i>
          </div>
          <div class="msc_folder_details">
            <div class="msc_folder_name_row">
              <span class="msc_folder_name">${c.nombre}</span>
              ${esActiva ? '<span class="msc_tag_active">Activa</span>' : ''}
              ${combinarTodas ? '<span class="msc_tag_combined">Combinada</span>' : ''}
            </div>
            <span class="msc_folder_sub">${c.canciones?.length || 0} canciones · ${c.fecha || 'Reciente'}</span>
          </div>
        </div>
        <div class="msc_folder_actions">
          ${(!esActiva && !combinarTodas) ? `
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

export function bindRutaLocalEvents(container, { onSeleccionarNuevaCarpeta, onActivarCarpeta, onEliminarCarpeta }) {
  wiTip();

  const dropzone = container.querySelector('#msc_dropzone_instant');
  const fileInput = container.querySelector('#msc_file_input_directory');

  if (dropzone) {
    dropzone.onclick = async () => {
      // Intentar selector nativo de Windows vía Rust Tauri
      if (typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)) {
        try {
          const { invoke } = window.__TAURI__.core || window.__TAURI__.tauri;
          const respuesta = await invoke('seleccionar_carpeta_musica_comando');
          if (respuesta && respuesta.canciones && respuesta.canciones.length > 0) {
            if (typeof onSeleccionarNuevaCarpeta === 'function') {
              onSeleccionarNuevaCarpeta(respuesta.canciones, respuesta.carpeta_nombre || 'Carpeta Importada', respuesta.ruta_raiz);
            }
            wiTip(dropzone, `Carpeta "${respuesta.carpeta_nombre}" activada (${respuesta.canciones.length} canciones)`, 'top', 2000);
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
            onSeleccionarNuevaCarpeta(canciones, carpetaNombre, null);
          }
          wiTip(dropzone, `Carpeta "${carpetaNombre}" activada (${canciones.length} canciones)`, 'top', 2000);
        }
      };
    }
  }

  // Acciones en Mis Carpetas (Activar / Eliminar)
  const foldersList = container.querySelector('#msc_folders_list');
  if (foldersList) {
    foldersList.onclick = (e) => {
      const btn = e.target.closest('.msc_folder_act_btn');
      if (!btn) return;

      const action = btn.dataset.action;
      const folderId = btn.dataset.folderId;

      if (action === 'activar' && typeof onActivarCarpeta === 'function') {
        onActivarCarpeta(folderId);
      } else if (action === 'eliminar' && typeof onEliminarCarpeta === 'function') {
        onEliminarCarpeta(folderId);
      }
    };
  }
}

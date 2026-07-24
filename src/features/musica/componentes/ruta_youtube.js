// src/features/musica/componentes/ruta_youtube.js
// Subcomponente: Descargador Inteligente de YouTube con wiSelect, barra de progreso de 0-100% y mensajes cada 10s

import { wiTip } from '@core/widev/witip.js';
import { wiSpin } from '@core/widev/spin.js';
import { Mensaje } from '@core/widev/mensajes.js';
import { wiSelect } from '@core/widev/wiselect.js';
import { getls, savels } from '@core/widev/storage.js';
import { wicopy } from '@core/widev/copy.js';

export function renderRutaYoutubeHTML(carpetaNombreDefecto = 'Carpeta de Música del Sistema') {
  const rutaGuardada = getls('youtube_carpeta');
  const rutaMostrar = rutaGuardada || carpetaNombreDefecto;

  return `
    <div class="msc_subpanel_title">
      <i class="fa-brands fa-youtube"></i> Descargar de YouTube
    </div>
    
    <div class="msc_yt_panel">
      <!-- Selector de Carpeta de Destino con Persistencia -->
      <div class="msc_yt_info_card">
        <span class="msc_yt_destination_label">
          <i class="fa-solid fa-folder-open"></i> Carpeta de Destino:
        </span>
        <div class="msc_yt_path_box">
          <input type="text" id="msc_yt_dest_path_input" readonly value="${rutaMostrar}" class="msc_yt_path_input" title="Haga clic en 'Seleccionar Carpeta' para cambiar la ruta" />
          <button id="msc_yt_btn_select_folder" class="msc_yt_folder_btn" title="Cambiar carpeta de destino para descargas">
            <i class="fa-solid fa-folder-tree"></i> Seleccionar Carpeta
          </button>
        </div>
      </div>

      <!-- Paso 1: Enlace de YouTube y Selector Premium wiSelect -->
      <div class="msc_yt_input_group">
        <input type="text" id="msc_yt_url" placeholder="Pega el enlace de la canción o lista de reproducción..." class="msc_yt_input_field" />
        
        <div class="msc_yt_select_wrapper">
          <select id="msc_yt_formato" class="msc_yt_format_select" title="Formato de salida">
            <option value="m4a">Audio Nativo M4A (Original)</option>
            <option value="mp3_320">Audio MP3 (320kbps - Máxima Calidad)</option>
            <option value="mp3_128">Audio MP3 (128kbps - Menor Peso)</option>
            <option value="opus">Audio OPUS (Ultra Ligero)</option>
          </select>
        </div>

        <button id="msc_yt_btn_scan" class="msc_yt_download_btn">
          <i class="fa-solid fa-magnifying-glass"></i> Escanear Enlace
        </button>
      </div>

      <!-- Container de Escaneo Animado y Resultado -->
      <div id="msc_yt_preview_container" class="msc_yt_preview_container" style="display: none;">
        <!-- Estado de Carga / Mensajes Dinámicos (10s) y Barra de Progreso 0-100% -->
        <div id="msc_yt_scanning_box" class="msc_yt_scanning_box" style="display: none;">
          <div class="msc_yt_scan_header">
            <div class="msc_yt_loader_row">
              <i class="fa-solid fa-circle-notch fa-spin msc_yt_spinner"></i>
              <span id="msc_yt_scan_msg" class="msc_yt_scan_msg">📡 Conectando con servidores de YouTube...</span>
            </div>
            <span id="msc_yt_scan_percent" class="msc_yt_scan_percent">0%</span>
          </div>
          <div class="msc_yt_scan_bar_outer">
            <div id="msc_yt_scan_bar_inner" class="msc_yt_scan_bar_inner" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Contenido del Resultado del Escáner -->
        <div id="msc_yt_preview_content" class="msc_yt_preview_content" style="display: none;">
          <div class="msc_yt_preview_header">
            <div class="msc_yt_preview_meta">
              <h4 id="msc_yt_playlist_title" class="msc_yt_playlist_title">Lista de Reproducción</h4>
              <span id="msc_yt_counter_badge" class="msc_yt_counter_badge">Seleccionadas: 0 / 10 (Límite recomendado)</span>
            </div>
            <div class="msc_yt_preview_actions">
              <button id="msc_yt_btn_select_all" class="msc_yt_secondary_btn">Seleccionar 10 primeras</button>
              <button id="msc_yt_btn_deselect_all" class="msc_yt_secondary_btn">Desmarcar todas</button>
            </div>
          </div>

          <div id="msc_yt_track_list" class="msc_yt_track_list">
            <!-- Pistas renderizadas dinámicamente con checkboxes -->
          </div>

          <div class="msc_yt_preview_footer">
            <button id="msc_yt_btn_download_selected" class="msc_yt_download_btn">
              <i class="fa-solid fa-cloud-arrow-down"></i> Descargar Seleccionadas (0)
            </button>
          </div>
        </div>
      </div>

      <!-- Sección de progreso global de descarga -->
      <div class="msc_yt_progress_container" id="msc_yt_progress" style="display: none;">
        <div class="msc_yt_loader_row">
          <i class="fa-solid fa-circle-notch fa-spin msc_yt_spinner"></i>
          <span class="msc_yt_status_text" id="msc_yt_status">Inicializando descargas...</span>
        </div>
        <div class="msc_yt_progress_bar_outer">
          <div class="msc_yt_progress_bar_inner" id="msc_yt_progress_bar"></div>
        </div>
        <div class="msc_yt_log_container" id="msc_yt_log">
          <!-- Logs dinámicos -->
        </div>
      </div>
    </div>
  `;
}

export function bindRutaYoutubeEvents(container, carpetaDestinoRutaInicial, onDescargaCompletada) {
  wiTip();

  const urlInput = container.querySelector('#msc_yt_url');
  const formatSelect = container.querySelector('#msc_yt_formato');
  const btnScan = container.querySelector('#msc_yt_btn_scan');
  
  const destPathInput = container.querySelector('#msc_yt_dest_path_input');
  const btnSelectFolder = container.querySelector('#msc_yt_btn_select_folder');

  const previewContainer = container.querySelector('#msc_yt_preview_container');
  const scanningBox = container.querySelector('#msc_yt_scanning_box');
  const scanMsgSpan = container.querySelector('#msc_yt_scan_msg');
  const scanPercentSpan = container.querySelector('#msc_yt_scan_percent');
  const scanBarInner = container.querySelector('#msc_yt_scan_bar_inner');
  const previewContent = container.querySelector('#msc_yt_preview_content');

  const playlistTitle = container.querySelector('#msc_yt_playlist_title');
  const counterBadge = container.querySelector('#msc_yt_counter_badge');
  const trackList = container.querySelector('#msc_yt_track_list');
  const btnSelectAll = container.querySelector('#msc_yt_btn_select_all');
  const btnDeselectAll = container.querySelector('#msc_yt_btn_deselect_all');
  const btnDownloadSelected = container.querySelector('#msc_yt_btn_download_selected');

  const progressContainer = container.querySelector('#msc_yt_progress');
  const statusText = container.querySelector('#msc_yt_status');
  const progressBar = container.querySelector('#msc_yt_progress_bar');
  const logContainer = container.querySelector('#msc_yt_log');

  let rutaDestinoActual = getls('youtube_carpeta') || carpetaDestinoRutaInicial || 'Música del Sistema';
  let cancionesEscaneadas = [];

  // Inicializar selector premium wiSelect
  if (formatSelect) {
    wiSelect(formatSelect, {
      placeholder: 'Selecciona formato de audio...',
      searchPlaceholder: 'Buscar formato...'
    });
  }

  // Copiar ruta al hacer clic en el input
  if (destPathInput) {
    destPathInput.onclick = () => {
      if (destPathInput.value) {
        wicopy(destPathInput, destPathInput, '¡Ruta copiada al portapapeles!');
      }
    };
  }

  // 1. Selector de Carpeta de Destino
  if (btnSelectFolder) {
    btnSelectFolder.onclick = async () => {
      if (typeof window !== 'undefined' && window.__TAURI__) {
        try {
          const core = window.__TAURI__.core || window.__TAURI__.tauri;
          const nuevaRuta = await core.invoke('seleccionar_carpeta_comando', {
            titulo: 'Seleccionar Carpeta de Destino para Música'
          });
          if (nuevaRuta) {
            rutaDestinoActual = nuevaRuta;
            savels('youtube_carpeta', nuevaRuta, 720);
            if (destPathInput) destPathInput.value = nuevaRuta;
            Mensaje(`Carpeta de descarga configurada: "${nuevaRuta}"`, 'success');
          }
        } catch (err) {
          console.error('[YouTube Folder Pick Error]:', err);
          Mensaje('No se pudo seleccionar la carpeta.', 'error');
        }
      } else {
        const simRuta = "C:\\Musica\\YouTube_Simulado";
        rutaDestinoActual = simRuta;
        savels('youtube_carpeta', simRuta, 720);
        if (destPathInput) destPathInput.value = simRuta;
        Mensaje(`Simulación: Carpeta guardada en "${simRuta}"`, 'success');
      }
    };
  }

  const actualizarContadorSeleccionadas = () => {
    const checkboxes = container.querySelectorAll('.msc_yt_track_check:checked');
    const totalSeleccionadas = checkboxes.length;
    
    if (counterBadge) {
      counterBadge.textContent = `Seleccionadas: ${totalSeleccionadas} / 10 (Límite recomendado)`;
      if (totalSeleccionadas > 10) {
        counterBadge.classList.add('warning');
      } else {
        counterBadge.classList.remove('warning');
      }
    }

    if (btnDownloadSelected) {
      btnDownloadSelected.disabled = totalSeleccionadas === 0;
      btnDownloadSelected.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Descargar Seleccionadas (${totalSeleccionadas})`;
    }
  };

  const agregarLog = (texto, tipo = 'info') => {
    if (!logContainer) return;
    const p = document.createElement('p');
    p.className = `msc_yt_log_line ${tipo}`;
    p.innerHTML = `<span class="msc_yt_log_time">${new Date().toLocaleTimeString()}</span> ${texto}`;
    logContainer.appendChild(p);
    logContainer.scrollTop = logContainer.scrollHeight;
  };

  // 2. Escanear enlace con mensajes cambiando CADA 10 SEGUNDOS y barra de progreso 0-100%
  const MENSAJES_ESCANEO = [
    '📡 Conectando con servidores de YouTube...',
    '🔍 Analizando estructura del enlace y metadatos...',
    '🎵 Extrayendo títulos, duraciones y formatos...',
    '✨ Verificando streams directos de alta velocidad...',
    '📋 Generando previsualización de la lista...'
  ];

  if (btnScan) {
    btnScan.onclick = async () => {
      const url = urlInput?.value.trim();
      if (!url) {
        wiTip(btnScan, 'Por favor, pega un enlace válido', 'top', 2000);
        return;
      }

      wiSpin(btnScan, true);
      btnScan.disabled = true;

      // Mostrar caja de escaneo animada
      if (previewContainer) previewContainer.style.display = 'block';
      if (previewContent) previewContent.style.display = 'none';
      if (scanningBox) scanningBox.style.display = 'flex';

      // Resetear progreso visual
      let progress = 0;
      if (scanPercentSpan) scanPercentSpan.textContent = '0%';
      if (scanBarInner) scanBarInner.style.width = '0%';

      // 1. Ticker suave de progreso de 0 a 92%
      const progressTimer = setInterval(() => {
        if (progress < 92) {
          progress += Math.random() * 3 + 1;
          if (progress > 92) progress = 92;
          const pRounded = Math.round(progress);
          if (scanPercentSpan) scanPercentSpan.textContent = `${pRounded}%`;
          if (scanBarInner) scanBarInner.style.width = `${pRounded}%`;
        }
      }, 150);

      // 2. Rotación de mensajes de estado CADA 10 SEGUNDOS (10000ms)
      let msgIndex = 0;
      if (scanMsgSpan) scanMsgSpan.textContent = MENSAJES_ESCANEO[0];
      const msgTimer = setInterval(() => {
        msgIndex = (msgIndex + 1) % MENSAJES_ESCANEO.length;
        if (scanMsgSpan) scanMsgSpan.textContent = MENSAJES_ESCANEO[msgIndex];
      }, 5000);

      if (typeof window !== 'undefined' && window.__TAURI__) {
        try {
          const core = window.__TAURI__.core || window.__TAURI__.tauri;
          const resultado = await core.invoke('escanear_lista_youtube_comando', { url });

          cancionesEscaneadas = resultado.pistas || [];
          if (playlistTitle) {
            playlistTitle.textContent = resultado.es_lista
              ? `📋 ${resultado.titulo_lista} (${resultado.total_pistas} canciones)`
              : `🎵 ${resultado.titulo_lista}`;
          }

          // Completar progreso al 100%
          clearInterval(progressTimer);
          if (scanPercentSpan) scanPercentSpan.textContent = '100%';
          if (scanBarInner) scanBarInner.style.width = '100%';

          await new Promise(r => setTimeout(r, 300));

          // Renderizar lista con checkboxes (máximo 10 marcadas por defecto)
          if (trackList) {
            trackList.innerHTML = cancionesEscaneadas.map((pista, idx) => `
              <div class="msc_yt_track_item" data-id="${pista.id}">
                <label class="msc_yt_track_label">
                  <input type="checkbox" class="msc_yt_track_check" data-idx="${idx}" ${idx < 10 ? 'checked' : ''} />
                  <span class="msc_yt_track_num">${idx + 1}.</span>
                  <span class="msc_yt_track_name" title="${pista.titulo}">${pista.titulo}</span>
                  <span class="msc_yt_track_dur">${pista.duracion}</span>
                </label>
                <span class="msc_yt_track_status" id="msc_yt_status_${idx}">Pendiente</span>
              </div>
            `).join('');

            trackList.querySelectorAll('.msc_yt_track_check').forEach(chk => {
              chk.onchange = actualizarContadorSeleccionadas;
            });
          }

          if (scanningBox) scanningBox.style.display = 'none';
          if (previewContent) previewContent.style.display = 'block';
          actualizarContadorSeleccionadas();
        } catch (err) {
          console.error('[YouTube Scan Error]:', err);
          Mensaje('Error al escanear el enlace de YouTube.', 'error');
          if (previewContainer) previewContainer.style.display = 'none';
        } finally {
          clearInterval(progressTimer);
          clearInterval(msgTimer);
          wiSpin(btnScan, false);
          btnScan.disabled = false;
        }
      } else {
        // Fallback simulado para desarrollo web
        setTimeout(() => {
          clearInterval(progressTimer);
          clearInterval(msgTimer);

          if (scanPercentSpan) scanPercentSpan.textContent = '100%';
          if (scanBarInner) scanBarInner.style.width = '100%';

          setTimeout(() => {
            cancionesEscaneadas = Array.from({ length: 12 }, (_, i) => ({
              id: `sim_${i}`,
              titulo: `Canción de Prueba YouTube ${i + 1} - Artista Simulado`,
              duracion: '3:45',
              url: url
            }));

            if (playlistTitle) playlistTitle.textContent = `📋 Lista Simulada de Ejemplo (12 canciones)`;
            if (trackList) {
              trackList.innerHTML = cancionesEscaneadas.map((pista, idx) => `
                <div class="msc_yt_track_item" data-id="${pista.id}">
                  <label class="msc_yt_track_label">
                    <input type="checkbox" class="msc_yt_track_check" data-idx="${idx}" ${idx < 10 ? 'checked' : ''} />
                    <span class="msc_yt_track_num">${idx + 1}.</span>
                    <span class="msc_yt_track_name" title="${pista.titulo}">${pista.titulo}</span>
                    <span class="msc_yt_track_dur">${pista.duracion}</span>
                  </label>
                  <span class="msc_yt_track_status" id="msc_yt_status_${idx}">Pendiente</span>
                </div>
              `).join('');

              trackList.querySelectorAll('.msc_yt_track_check').forEach(chk => {
                chk.onchange = actualizarContadorSeleccionadas;
              });
            }

            if (scanningBox) scanningBox.style.display = 'none';
            if (previewContent) previewContent.style.display = 'block';
            actualizarContadorSeleccionadas();
            wiSpin(btnScan, false);
            btnScan.disabled = false;
          }, 300);
        }, 1500);
      }
    };
  }

  // 3. Botones de Selección Rápida
  btnSelectAll?.addEventListener('click', () => {
    container.querySelectorAll('.msc_yt_track_check').forEach((chk, idx) => {
      chk.checked = idx < 10;
    });
    actualizarContadorSeleccionadas();
  });

  btnDeselectAll?.addEventListener('click', () => {
    container.querySelectorAll('.msc_yt_track_check').forEach(chk => chk.checked = false);
    actualizarContadorSeleccionadas();
  });

  // 4. Descarga Secuencial en Lote de las Canciones Seleccionadas
  if (btnDownloadSelected) {
    btnDownloadSelected.onclick = async () => {
      const checkboxes = Array.from(container.querySelectorAll('.msc_yt_track_check:checked'));
      if (checkboxes.length === 0) return;

      const formatoElegido = formatSelect?.value || 'm4a';

      btnDownloadSelected.disabled = true;
      if (btnScan) btnScan.disabled = true;
      if (progressContainer) progressContainer.style.display = 'block';
      if (logContainer) logContainer.innerHTML = '';
      if (progressBar) progressBar.style.width = '0%';

      const carpetaNombreFinal = rutaDestinoActual.split(/[\/\\]/).pop() || 'Carpeta';
      agregarLog(`Iniciando descarga de ${checkboxes.length} canciones (${formatoElegido.toUpperCase()}) en "${rutaDestinoActual}"...`, 'info');

      let completadas = 0;
      const total = checkboxes.length;

      for (let i = 0; i < total; i++) {
        const chk = checkboxes[i];
        const idx = parseInt(chk.getAttribute('data-idx'), 10);
        const pista = cancionesEscaneadas[idx];
        const statusSpan = container.querySelector(`#msc_yt_status_${idx}`);

        if (!pista) continue;

        if (statusText) statusText.textContent = `Descargando (${i + 1}/${total}): ${pista.titulo}...`;
        if (statusSpan) {
          statusSpan.textContent = 'Descargando...';
          statusSpan.className = 'msc_yt_track_status downloading';
        }

        agregarLog(`Descargando [${i + 1}/${total}]: ${pista.titulo}...`, 'info');

        if (typeof window !== 'undefined' && window.__TAURI__) {
          try {
            const core = window.__TAURI__.core || window.__TAURI__.tauri;
            const cancionDescargada = await core.invoke('descargar_cancion_youtube_comando', {
              url: pista.url,
              carpetaDestino: rutaDestinoActual,
              formato: formatoElegido
            });

            completadas++;
            const pct = Math.round((completadas / total) * 100);
            if (progressBar) progressBar.style.width = `${pct}%`;

            if (statusSpan) {
              statusSpan.textContent = '✓ Listo';
              statusSpan.className = 'msc_yt_track_status completed';
            }

            agregarLog(`✓ Descargada: ${cancionDescargada.archivo} (${cancionDescargada.peso})`, 'success');

            if (typeof onDescargaCompletada === 'function') {
              onDescargaCompletada(cancionDescargada);
            }
          } catch (err) {
            console.error(`Error al descargar ${pista.titulo}:`, err);
            if (statusSpan) {
              statusSpan.textContent = '✗ Error';
              statusSpan.className = 'msc_yt_track_status error';
            }
            agregarLog(`✗ Falló: ${pista.titulo} (${err})`, 'error');
          }
        } else {
          // Simulación web
          await new Promise(res => setTimeout(res, 600));
          completadas++;
          const pct = Math.round((completadas / total) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;

          if (statusSpan) {
            statusSpan.textContent = '✓ Listo';
            statusSpan.className = 'msc_yt_track_status completed';
          }
          agregarLog(`✓ Simulado: ${pista.titulo}`, 'success');
        }
      }

      if (statusText) statusText.textContent = `¡Descargas finalizadas! (${completadas}/${total} en "${carpetaNombreFinal}")`;
      agregarLog(`🎉 Lote completado exitosamente (${completadas}/${total} guardadas en "${rutaDestinoActual}").`, 'success');

      // Notificación flotante de confirmación con la ruta guardada
      Mensaje(`¡${completadas} canción(es) descargada(s) con éxito en "${carpetaNombreFinal}"!`, 'success');

      btnDownloadSelected.disabled = false;
      if (btnScan) btnScan.disabled = false;
    };
  }
}

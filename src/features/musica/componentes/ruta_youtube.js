// src/features/musica/componentes/ruta_youtube.js
// Subcomponente: Descargador Premium de Música de YouTube

import { wiTip } from '@core/widev/witip.js';

export function renderRutaYoutubeHTML(carpetaNombre = 'Sin Carpeta') {
  return `
    <div class="msc_subpanel_title">
      <i class="fa-brands fa-youtube"></i> Descargar de YouTube
    </div>
    
    <div class="msc_yt_panel">
      <div class="msc_yt_info_card">
        <span class="msc_yt_destination_label">Carpeta de Destino:</span>
        <span class="msc_yt_destination_name" id="msc_yt_dest_folder">${carpetaNombre}</span>
      </div>

      <div class="msc_yt_input_group">
        <input type="text" id="msc_yt_url" placeholder="Pega el enlace de la canción o video de YouTube..." class="msc_yt_input_field" />
        <button id="msc_yt_btn_download" class="msc_yt_download_btn">
          <i class="fa-solid fa-cloud-arrow-down"></i> Descargar M4A
        </button>
      </div>

      <!-- Sección de progreso de descarga -->
      <div class="msc_yt_progress_container" id="msc_yt_progress">
        <div class="msc_yt_loader_row">
          <i class="fa-solid fa-circle-notch fa-spin msc_yt_spinner"></i>
          <span class="msc_yt_status_text" id="msc_yt_status">Verificando descargador...</span>
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

export function bindRutaYoutubeEvents(container, carpetaDestinoRuta, onDescargaCompletada) {
  wiTip();

  const urlInput = container.querySelector('#msc_yt_url');
  const btnDownload = container.querySelector('#msc_yt_btn_download');
  const progressContainer = container.querySelector('#msc_yt_progress');
  const statusText = container.querySelector('#msc_yt_status');
  const progressBar = container.querySelector('#msc_yt_progress_bar');
  const logContainer = container.querySelector('#msc_yt_log');

  if (!btnDownload) return;

  btnDownload.onclick = async () => {
    const url = urlInput?.value.trim();
    if (!url) {
      wiTip(btnDownload, 'Por favor, pega un enlace válido', 'top', 2000);
      return;
    }

    if (!carpetaDestinoRuta) {
      wiTip(btnDownload, 'Error: No hay una carpeta activa seleccionada', 'top', 2000);
      return;
    }

    // Inicializar UI de progreso
    btnDownload.disabled = true;
    if (urlInput) urlInput.disabled = true;
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '5%';
    if (logContainer) logContainer.innerHTML = '';

    const agregarLog = (texto, tipo = 'info') => {
      if (!logContainer) return;
      const p = document.createElement('p');
      p.className = `msc_yt_log_line ${tipo}`;
      p.innerHTML = `<span class="msc_yt_log_time">${new Date().toLocaleTimeString()}</span> ${texto}`;
      logContainer.appendChild(p);
      logContainer.scrollTop = logContainer.scrollHeight;
    };

    agregarLog('Iniciando proceso de descarga...', 'info');
    if (statusText) statusText.textContent = 'Inicializando descarga...';

    // Llamar al backend de Tauri
    if (typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)) {
      try {
        const { invoke } = window.__TAURI__.core || window.__TAURI__.tauri;
        
        agregarLog('Comprobando y asegurando descargador local (yt-dlp.exe)...', 'info');
        if (progressBar) progressBar.style.width = '25%';

        // Ejecutar descarga
        agregarLog('Conectando con YouTube y descargando audio (M4A)...', 'info');
        if (statusText) statusText.textContent = 'Descargando audio...';
        if (progressBar) progressBar.style.width = '50%';

        const cancionDescargada = await invoke('descargar_cancion_youtube_comando', {
          url: url,
          carpetaDestino: carpetaDestinoRuta
        });

        agregarLog('¡Canción descargada con éxito! Escaneando metadatos...', 'success');
        if (statusText) statusText.textContent = '¡Completado!';
        if (progressBar) progressBar.style.width = '100%';
        agregarLog(`Archivo guardado: ${cancionDescargada.archivo} (${cancionDescargada.peso})`, 'success');

        if (typeof onDescargaCompletada === 'function') {
          onDescargaCompletada(cancionDescargada);
        }

        wiTip(btnDownload, 'Canción descargada y añadida a la biblioteca', 'top', 2000);
        
        // Resetear formulario
        if (urlInput) urlInput.value = '';
      } catch (err) {
        console.error('YouTube download error:', err);
        agregarLog(`Error: ${err}`, 'error');
        if (statusText) statusText.textContent = 'Fallo en la descarga';
        if (progressBar) progressBar.style.backgroundColor = 'var(--error)';
        wiTip(btnDownload, 'Error al descargar la canción', 'top', 2500);
      } finally {
        btnDownload.disabled = false;
        if (urlInput) urlInput.disabled = false;
      }
    } else {
      // Fallback simulado para navegador web sin Tauri
      setTimeout(() => {
        agregarLog('Simulando conexión con backend de desarrollo...', 'info');
        if (progressBar) progressBar.style.width = '40%';
        setTimeout(() => {
          agregarLog('Descargando audio ficticio de YouTube...', 'info');
          if (progressBar) progressBar.style.width = '80%';
          setTimeout(() => {
            agregarLog('Simulación completada en modo web.', 'success');
            if (progressBar) progressBar.style.width = '100%';
            if (statusText) statusText.textContent = 'Simulación exitosa';
            btnDownload.disabled = false;
            if (urlInput) urlInput.disabled = false;
          }, 1000);
        }, 1000);
      }, 1000);
    }
  };
}

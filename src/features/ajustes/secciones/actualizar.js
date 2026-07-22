// src/features/ajustes/secciones/actualizar.js
// Sub-pestaña Actualizar — Comprobación de versiones y descarga/instalación dinámica

import { Mensaje } from '@widev';
import './actualizar.css';

let desregistrarProgreso = null;

export async function arrancar(container) {
  // Limpiar listener previo si existe para evitar duplicados en memoria
  if (typeof desregistrarProgreso === 'function') {
    desregistrarProgreso();
    desregistrarProgreso = null;
  }

  // Obtener la versión actual de la app desde Rust
  let versionActual = '0.1.0';
  if (window.__TAURI__) {
    try {
      versionActual = await window.__TAURI__.core.invoke('actualizador_obtener_version_actual');
    } catch (err) {
      console.error('[Actualizador] Error al obtener versión actual de Rust:', err);
    }
  }

  container.innerHTML = `
    <div class="actualizar_section_wrap">
      <div class="ajustes_card actualizar_card">
        <h3 class="actualizar_title"><i class="fa-solid fa-circle-arrow-up"></i> Actualizar Pancitawii</h3>
        
        <div class="actualizar_status_box">
          <div class="status_info">
            <span class="status_label">Versión Instalada</span>
            <span class="status_value">Pancitawii <span class="badge_version">v${versionActual}</span></span>
          </div>
          <div class="status_action">
            <button id="actualizar_btn_buscar" class="actualizar_btn">
              <i class="fa-solid fa-arrows-rotate"></i> Buscar Actualización
            </button>
          </div>
        </div>

        <div id="actualizar_resultado_wrapper"></div>
      </div>
    </div>
  `;

  const btnBuscar = container.querySelector('#actualizar_btn_buscar');
  const resultadoWrapper = container.querySelector('#actualizar_resultado_wrapper');

  btnBuscar?.addEventListener('click', async () => {
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...`;
    resultadoWrapper.innerHTML = '';

    try {
      // 1. Consultar la API de GitHub Releases
      const respuesta = await fetch('https://api.github.com/repos/wtaype/pancitawiiw/releases/latest');
      if (!respuesta.ok) {
        throw new Error('No se pudo conectar con el servidor de actualizaciones.');
      }
      
      const release = await respuesta.json();
      const versionNueva = release.tag_name; // Ej: v1.0.0
      
      // Encontrar el asset de descarga de pancitawii.zip
      const asset = release.assets.find(a => a.name.endsWith('.zip'));
      if (!asset) {
        throw new Error('No se encontró el paquete "pancitawii.zip" en la release de GitHub.');
      }
      
      const downloadUrl = asset.browser_download_url;

      // 2. Comparar versiones
      if (esVersionNueva(versionActual, versionNueva)) {
        resultadoWrapper.innerHTML = `
          <div class="actualizar_news_box">
            <h4 class="actualizar_news_title">🎁 ¡Nueva actualización disponible: ${versionNueva}!</h4>
            <div class="actualizar_news_content">
              ${formatearNotas(release.body)}
            </div>
          </div>

          <button id="actualizar_btn_instalar" class="actualizar_btn" style="width: 100%; margin-top: 2vh;">
            <i class="fa-solid fa-circle-down"></i> Descargar e Instalar Ahora
          </button>

          <div id="actualizar_progreso_contenedor"></div>
        `;

        const btnInstalar = container.querySelector('#actualizar_btn_instalar');
        btnInstalar?.addEventListener('click', async () => {
          btnInstalar.disabled = true;
          btnInstalar.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Preparando descarga...`;

          const progresoContenedor = container.querySelector('#actualizar_progreso_contenedor');
          progresoContenedor.innerHTML = `
            <div class="actualizar_progress_wrapper">
              <div class="progress_stats">
                <span id="progreso_bytes">Descargando...</span>
                <span id="progreso_porcentaje" class="progress_percent">0%</span>
              </div>
              <div class="progress_track">
                <div id="progreso_barra" class="progress_fill" style="width: 0%;"></div>
              </div>
            </div>
          `;

          const txtBytes = container.querySelector('#progreso_bytes');
          const txtPorcentaje = container.querySelector('#progreso_porcentaje');
          const barraProgreso = container.querySelector('#progreso_barra');

          // Escuchar evento de progreso de descarga desde Rust
          if (window.__TAURI__) {
            try {
              desregistrarProgreso = await window.__TAURI__.event.listen('download-progress', (event) => {
                const { porcentaje, descargado, total } = event.payload;
                const descMB = (descargado / (1024 * 1024)).toFixed(2);
                const totalMB = (total / (1024 * 1024)).toFixed(2);

                txtBytes.innerText = `Descargado: ${descMB} MB / ${totalMB} MB`;
                txtPorcentaje.innerText = `${porcentaje}%`;
                barraProgreso.style.width = `${porcentaje}%`;

                if (porcentaje >= 100) {
                  btnInstalar.innerHTML = `<i class="fa-solid fa-circle-check"></i> Instalando...`;
                  txtBytes.innerText = `Extrayendo archivos y reiniciando app...`;
                }
              });

              // Llamar a Rust para iniciar la descarga y posterior actualización
              await window.__TAURI__.core.invoke('actualizador_descargar_y_actualizar', { url: downloadUrl });
            } catch (err) {
              console.error('[Actualizador] Error durante la actualización:', err);
              Mensaje('Ocurrió un error al descargar la actualización.', 'error');
              btnInstalar.disabled = false;
              btnInstalar.innerHTML = `<i class="fa-solid fa-circle-down"></i> Descargar e Instalar Ahora`;
              progresoContenedor.innerHTML = '';
            }
          } else {
            // Simulación en entorno web de prueba
            let p = 0;
            const timer = setInterval(() => {
              p += 10;
              txtBytes.innerText = `Descargado: ${(p * 0.6).toFixed(2)} MB / 60.00 MB (Simulado)`;
              txtPorcentaje.innerText = `${p}%`;
              barraProgreso.style.width = `${p}%`;
              if (p >= 100) {
                clearInterval(timer);
                btnInstalar.innerHTML = `Instalado (Simulación)`;
                Mensaje('¡Simulación de actualización exitosa!', 'success');
              }
            }, 300);
          }
        });
      } else {
        resultadoWrapper.innerHTML = `
          <div class="actualizar_news_box" style="border-style: solid; border-color: rgba(34, 197, 94, 0.2); background: rgba(34, 197, 94, 0.02); text-align: center; padding: 4vh 2vh;">
            <i class="fa-solid fa-circle-check" style="font-size: 5vh; color: #22c55e; margin-bottom: 2vh;"></i>
            <h4 class="actualizar_news_title" style="margin-bottom: 1vh;">¡Pancitawii está actualizado!</h4>
            <p style="color: var(--text-muted, #94a3b8); font-size: 1.6vh; margin: 0;">Ya tienes instalada la versión más reciente (v${versionActual}).</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('[Actualizador] Error al buscar actualizaciones:', err);
      Mensaje('No se pudo verificar actualizaciones. Inténtalo más tarde.', 'error');
      resultadoWrapper.innerHTML = `
        <div class="actualizar_news_box" style="border-style: solid; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.02); text-align: center;">
          <p style="color: #ef4444; font-size: 1.7vh; margin: 0;">${err.message || 'Error de conexión con el servidor.'}</p>
        </div>
      `;
    } finally {
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Buscar Actualización`;
    }
  });
}

// Función auxiliar para comparar versiones semánticas (v1.0.0 vs v1.0.1)
function esVersionNueva(versionActual, versionNueva) {
  const vA = versionActual.replace(/^v/, '').split('.').map(Number);
  const vN = versionNueva.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(vA.length, vN.length); i++) {
    const numA = vA[i] || 0;
    const numN = vN[i] || 0;
    if (numN > numA) return true;
    if (numN < numA) return false;
  }
  return false;
}

// Función auxiliar para formatear notas de versión básicas en HTML
function formatearNotas(markdown) {
  if (!markdown) return 'No hay notas para esta versión.';
  return markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<strong style="display: block; margin-top: 1.5vh; font-size: 1.8vh; color: var(--accent-color, #c084fc);">$1</strong>')
    .replace(/^## (.*$)/gim, '<strong style="display: block; margin-top: 2vh; font-size: 1.9vh; color: var(--text-color, #ffffff);">$1</strong>')
    .replace(/^# (.*$)/gim, '<strong style="display: block; margin-top: 2.5vh; font-size: 2.1vh; color: var(--text-color, #ffffff);">$1</strong>')
    .replace(/^\* (.*$)/gim, '• $1')
    .replace(/^- (.*$)/gim, '• $1')
    .replace(/\r\n|\r|\n/g, '<br>');
}

// src/features/actualizar/actualizar.js
// Módulo Standalone: Centro de Actualización de Pancitawii con compilador Markdown wiMd

import { Mensaje } from '@core/widev/mensajes.js';
import { wiMd } from '@core/widev/wimd.js';
import { wiSpin } from '@core/widev/spin.js';
import { wiTip } from '@core/widev/witip.js';
import './actualizar.css';

let desregistrarProgreso = null;

export function renderActualizar() {
  return `
    <div class="actualizar_container">
      <div class="actualizar_card">
        <div class="actualizar_header_row">
          <h3 class="actualizar_title">
            <i class="fa-solid fa-cloud-arrow-down"></i> Actualizaciones de Sistema
          </h3>
        </div>

        <div class="actualizar_status_box">
          <div class="status_info">
            <span class="status_label">Versión del Sistema</span>
            <span class="status_value">Pancitawii <span class="badge_version" id="actualizar_version_badge">Cargando...</span></span>
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
}

export function arrancar(container) {
  container.innerHTML = renderActualizar();
  bindActualizarEvents(container);
}

export async function bindActualizarEvents(container) {
  wiTip();

  if (typeof desregistrarProgreso === 'function') {
    desregistrarProgreso();
    desregistrarProgreso = null;
  }

  const versionBadge = container.querySelector('#actualizar_version_badge');
  const btnBuscar = container.querySelector('#actualizar_btn_buscar');
  const resultadoWrapper = container.querySelector('#actualizar_resultado_wrapper');

  let versionActual = '2.8.0';
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      const core = window.__TAURI__.core || window.__TAURI__.tauri;
      const ver = await core.invoke('actualizador_obtener_version_actual');
      if (ver) versionActual = ver;
    } catch (err) {
      console.warn('[Actualizador] No se pudo obtener versión de Rust:', err);
    }
  }

  if (versionBadge) {
    versionBadge.textContent = `v${versionActual}`;
  }

  if (!btnBuscar) return;

  btnBuscar.onclick = async () => {
    wiSpin(btnBuscar, true);
    btnBuscar.disabled = true;
    if (resultadoWrapper) resultadoWrapper.innerHTML = '';

    try {
      // Consultar API de GitHub Releases
      const respuesta = await fetch('https://api.github.com/repos/wtaype/pancitawiiw/releases/latest');
      if (!respuesta.ok) {
        throw new Error('No se pudo conectar con el servidor de actualizaciones.');
      }

      const release = await respuesta.json();
      const versionNueva = release.tag_name || 'v0.0.0';
      const asset = release.assets?.find(a => a.name.endsWith('.zip'));
      const downloadUrl = asset?.browser_download_url || '';

      if (esVersionNueva(versionActual, versionNueva)) {
        // Renderizar notas de actualización formateadas con el compilador Markdown wiMd
        const notasHTML = wiMd(release.body || 'Novedades y mejoras de rendimiento.');

        resultadoWrapper.innerHTML = `
          <div class="actualizar_news_box">
            <h4 class="actualizar_news_title">
              <i class="fa-solid fa-gift"></i> ¡Nueva versión disponible: ${versionNueva}!
            </h4>
            <div class="actualizar_news_content">
              ${notasHTML}
            </div>
            
            <button id="actualizar_btn_instalar" class="actualizar_btn" style="margin-top: 1.5vh;">
              <i class="fa-solid fa-download"></i> Descargar e Instalar Ahora
            </button>
            <div id="actualizar_progreso_contenedor"></div>
          </div>
        `;

        const btnInstalar = container.querySelector('#actualizar_btn_instalar');
        const progresoContenedor = container.querySelector('#actualizar_progreso_contenedor');

        if (btnInstalar) {
          btnInstalar.onclick = async () => {
            btnInstalar.disabled = true;
            wiSpin(btnInstalar, true);

            if (progresoContenedor) {
              progresoContenedor.innerHTML = `
                <div class="actualizar_progress_wrapper">
                  <div class="progress_stats">
                    <span id="progreso_bytes">Iniciando descarga...</span>
                    <span id="progreso_porcentaje" class="progress_percent">0%</span>
                  </div>
                  <div class="progress_track">
                    <div id="progreso_barra" class="progress_fill" style="width: 0%;"></div>
                  </div>
                </div>
              `;
            }

            const txtBytes = container.querySelector('#progreso_bytes');
            const txtPorcentaje = container.querySelector('#progreso_porcentaje');
            const barraProgreso = container.querySelector('#progreso_barra');

            if (typeof window !== 'undefined' && window.__TAURI__) {
              try {
                const eventApi = window.__TAURI__.event;
                const core = window.__TAURI__.core || window.__TAURI__.tauri;

                if (eventApi && typeof eventApi.listen === 'function') {
                  desregistrarProgreso = await eventApi.listen('download-progress', (e) => {
                    const { porcentaje, descargado, total } = e.payload || {};
                    const descMB = ((descargado || 0) / (1024 * 1024)).toFixed(2);
                    const totalMB = ((total || 1) / (1024 * 1024)).toFixed(2);

                    if (txtBytes) txtBytes.innerText = `Descargado: ${descMB} MB / ${totalMB} MB`;
                    if (txtPorcentaje) txtPorcentaje.innerText = `${porcentaje || 0}%`;
                    if (barraProgreso) barraProgreso.style.width = `${porcentaje || 0}%`;

                    if (porcentaje >= 100) {
                      if (btnInstalar) btnInstalar.innerHTML = `<i class="fa-solid fa-circle-check"></i> Aplicando cambios...`;
                      if (txtBytes) txtBytes.innerText = `Extrayendo e instalando...`;
                    }
                  });
                }

                await core.invoke('actualizador_descargar_y_actualizar', { url: downloadUrl });
              } catch (err) {
                console.error('[Actualizador] Error al instalar:', err);
                Mensaje('Error durante la instalación de la actualización.', 'error');
                wiSpin(btnInstalar, false);
                btnInstalar.disabled = false;
              }
            } else {
              // Simulación en entorno web
              let p = 0;
              const timer = setInterval(() => {
                p += 20;
                if (txtPorcentaje) txtPorcentaje.innerText = `${p}%`;
                if (barraProgreso) barraProgreso.style.width = `${p}%`;
                if (p >= 100) {
                  clearInterval(timer);
                  wiSpin(btnInstalar, false);
                  btnInstalar.disabled = false;
                  Mensaje('¡Simulación de actualización completada!', 'success');
                }
              }, 400);
            }
          };
        }
      } else {
        resultadoWrapper.innerHTML = `
          <div class="actualizar_success_box">
            <i class="fa-solid fa-circle-check actualizar_success_icon"></i>
            <h4 class="actualizar_title" style="font-size: var(--fz_m3);">¡Pancitawii está completamente al día!</h4>
            <p class="status_label" style="text-transform: none; font-size: var(--fz_m1);">
              Tienes instalada la versión más reciente (v${versionActual}).
            </p>
          </div>
        `;
      }
    } catch (err) {
      console.error('[Actualizador] Error al verificar:', err);
      Mensaje('No se pudo verificar actualizaciones.', 'error');
      if (resultadoWrapper) {
        resultadoWrapper.innerHTML = `
          <div class="actualizar_success_box" style="border-color: var(--error);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--error);"></i>
            <p class="status_label" style="color: var(--tx1); text-transform: none;">
              ${err.message || 'Error de conexión con GitHub.'}
            </p>
          </div>
        `;
      }
    } finally {
      wiSpin(btnBuscar, false);
      btnBuscar.disabled = false;
    }
  };
}

function esVersionNueva(versionActual, versionNueva) {
  const vA = (versionActual || '0.0.0').replace(/^v/, '').split('.').map(Number);
  const vN = (versionNueva || '0.0.0').replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(vA.length, vN.length); i++) {
    const numA = vA[i] || 0;
    const numN = vN[i] || 0;
    if (numN > numA) return true;
    if (numN < numA) return false;
  }
  return false;
}

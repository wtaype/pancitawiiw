// src/features/cuenta/secciones/apis.js
// Sub-pestaña: Centro APIs y Métricas de Uso

import { wiSelect, Mensaje, getls } from '@widev';
import './apis.css';

export function arrancar(panel) {
  const savedKeyVal = localStorage.getItem('gemini_api_key') || '';
  const savedModelVal = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';

  panel.innerHTML = `
    <div class="cuenta_apis_wrapper">
      
      <!-- Columna Izquierda: Formulario de Configuración -->
      <div class="cuenta_apis_form">
        <div class="cuenta_card">
          <h2 class="cuenta_card_tit"><i class="fa-solid fa-cubes"></i> Configuración de APIs</h2>
          
          <div class="cuenta_form_grp">
            <label for="cuenta_gemini_key"><i class="fa-solid fa-key"></i> Clave API de Gemini</label>
            <div class="cuenta_pass_wrap">
              <input type="password" id="cuenta_gemini_key" value="${savedKeyVal}" placeholder="AIzaSy...">
              <button type="button" class="cuenta_pass_eye" data-target="cuenta_gemini_key">
                <i class="fa-solid fa-eye-slash"></i>
              </button>
            </div>
            <p class="cuenta_form_tip">Esta clave se utilizará para realizar las peticiones de streaming de ChatWii. Obtén tu clave en <a href="https://aistudio.google.com/api-keys" target="_blank" class="cuenta_api_link"><i class="fa-solid fa-up-right-from-square" style="font-size: var(--fz_s3);"></i> Google AI Studio</a>.</p>
          </div>

          <div class="cuenta_form_grp">
            <label for="cuenta_gemini_model"><i class="fa-solid fa-brain"></i> Modelo Gemini Principal</label>
            <select id="cuenta_gemini_model" class="cuenta_form_select">
              <option value="gemini-3.1-flash-lite" ${savedModelVal === 'gemini-3.1-flash-lite' ? 'selected' : ''}>gemini-3.1-flash-lite (Ultra Rápido y Ligero)</option>
              <option value="gemini-2.5-flash" ${savedModelVal === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (Por Defecto - Rápido)</option>
              <option value="gemini-2.5-pro" ${savedModelVal === 'gemini-2.5-pro' ? 'selected' : ''}>gemini-2.5-pro (Inteligencia Superior)</option>
              <option value="gemini-2.0-flash" ${savedModelVal === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Flash v2)</option>
            </select>
            <p class="cuenta_form_tip">Modelo de lenguaje preferido para las respuestas del chat.</p>
          </div>

          <button id="cuenta_guardar_apis_btn" class="cuenta_btn"><i class="fa-solid fa-save"></i> Guardar APIs</button>
        </div>
      </div>

      <!-- Columna Derecha: Panel de Métricas e Información de Uso -->
      <div class="cuenta_apis_metrics">
        <div class="cuenta_card">
          <h2 class="cuenta_card_tit"><i class="fa-solid fa-chart-simple"></i> Estado y Métricas</h2>
          
          <div class="cuenta_metric_row">
            <span class="cuenta_metric_lbl"><i class="fa-solid fa-signal"></i> Estado Key:</span>
            <span class="cuenta_metric_val" id="cuenta_metric_estado">—</span>
          </div>
          
          <div class="cuenta_metric_row">
            <span class="cuenta_metric_lbl"><i class="fa-solid fa-chart-pie"></i> Peticiones Hoy:</span>
            <span class="cuenta_metric_val" id="cuenta_metric_peticiones" style="font-family: var(--ff_O); font-weight: 700;">0 / 60</span>
          </div>

          <div class="cuenta_metric_row">
            <span class="cuenta_metric_lbl"><i class="fa-solid fa-microchip"></i> Modelo Activo:</span>
            <span class="cuenta_metric_val" id="cuenta_metric_modelo">—</span>
          </div>

          <div class="cuenta_metric_row">
            <span class="cuenta_metric_lbl"><i class="fa-solid fa-receipt"></i> Costo Estimado:</span>
            <span class="cuenta_metric_val" style="color: var(--success); font-weight: 700;">Gratuito (Free Tier)</span>
          </div>

          <div class="cuenta_metric_row">
            <span class="cuenta_metric_lbl"><i class="fa-solid fa-gauge-high"></i> Latencia Media:</span>
            <span class="cuenta_metric_val" style="color: var(--dulce); font-weight: 700;">&lt; 1.8s</span>
          </div>
        </div>
      </div>

    </div>
  `;

  // 1. Convertir el select en un selector premium con wiSelect
  const selectModel = panel.querySelector('#cuenta_gemini_model');
  let wiSelectCtrl = null;
  if (selectModel) {
    wiSelectCtrl = wiSelect(selectModel, {
      placeholder: 'Selecciona un modelo...',
      searchPlaceholder: 'Buscar...',
      onChange: () => {}
    });
  }

  // 2. Alternancia de visibilidad de clave (ojo)
  const eye = panel.querySelector('.cuenta_pass_eye');
  if (eye) {
    eye.addEventListener('click', (e) => {
      e.preventDefault();
      const input = panel.querySelector('#cuenta_gemini_key');
      const icon = eye.querySelector('i');
      if (input && icon) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        icon.className = isPass ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      }
    });
  }

  // 3. Renderizar y actualizar métricas
  const actualizarMetricas = () => {
    const keyInput = panel.querySelector('#cuenta_gemini_key');
    const keyVal = keyInput?.value.trim() || '';

    // Estado de API Key
    const estadoEl = panel.querySelector('#cuenta_metric_estado');
    if (estadoEl) {
      if (keyVal) {
        estadoEl.innerHTML = '<span class="cuenta_metric_badge success">Activo 🟢</span>';
      } else {
        estadoEl.innerHTML = '<span class="cuenta_metric_badge danger">Inactivo 🔴</span>';
      }
    }

    // Peticiones de hoy
    const peticionesEl = panel.querySelector('#cuenta_metric_peticiones');
    if (peticionesEl) {
      const s = JSON.parse(localStorage.getItem('limiteHoy_chatwii_pancita_uses')) || { n: 0 };
      peticionesEl.textContent = `${s.n || 0} / 60`;
    }

    // Modelo Activo
    const modeloEl = panel.querySelector('#cuenta_metric_modelo');
    if (modeloEl) {
      const currentModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
      modeloEl.innerHTML = `<span class="cuenta_model_chip">${currentModel}</span>`;
    }
  };

  // Cargar métricas iniciales
  actualizarMetricas();

  // 4. Acción de Guardar APIs
  const guardarApis = () => {
    const keyInput = panel.querySelector('#cuenta_gemini_key');
    const modelVal = selectModel ? selectModel.value : 'gemini-2.5-flash';
    const keyVal = keyInput?.value.trim() || '';

    localStorage.setItem('gemini_api_key', keyVal);
    localStorage.setItem('gemini_model', modelVal);

    actualizarMetricas();
    Mensaje('¡Configuración de APIs guardada correctamente!', 'success');
  };

  const btnGuardarApis = panel.querySelector('#cuenta_guardar_apis_btn');
  if (btnGuardarApis) {
    btnGuardarApis.addEventListener('click', guardarApis);
  }

  // Guardar listener para llamadas desde el action de guardado global
  panel._guardarAccion = guardarApis;
}

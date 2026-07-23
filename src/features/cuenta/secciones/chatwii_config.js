// src/features/cuenta/secciones/chatwii_config.js
// Sub-pestaña: Configuración de ChatWii (Fase 1.2: Multi-Proveedor de Voz Azure/Google/ElevenLabs + Textarea de Demostración)

import { wiSelect, Mensaje, wiTip, getls, savels, saludoSmile } from '@widev';
import { MODELO_PRINCIPAL, MODELOS_RESPALDO, MODELO_PRINCIPAL_VOZ, MODELOS_SECUNDARIOS_VOZ } from '@features/chatwii/brain.js';
import { probarMicrofono, detenerPruebaMicrofono, probarDemostrasionVozCustom, detenerAudioHablado } from '@features/chatwii/lib/voz_asistente.js';
import { PROVEEDORES_VOZ, LISTA_VOCES, obtenerVocesPorProveedor } from '@features/chatwii/lib/lista_voces.js';
import './chatwii_config.css';

/**
 * Obtiene el objeto de configuración unificado desde localStorage
 */
export function obtenerConfigChatWii() {
  const defaults = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    modeloTexto: localStorage.getItem('gemini_model') || MODELO_PRINCIPAL,
    voz: {
      activa: getls('chatwii_voz_activa') ?? getls('voz_chatwii') ?? false,
      modelo: getls('chatwii_voz_modelo') || MODELO_PRINCIPAL_VOZ,
      proveedor: getls('chatwii_voz_proveedor') || 'azure',
      tipo: getls('chatwii_voz_tipo') || 'es-MX-DaliaNeural'
    }
  };

  const storedObj = getls('chatwii_config');
  if (storedObj && typeof storedObj === 'object') {
    return {
      ...defaults,
      ...storedObj,
      voz: {
        ...defaults.voz,
        ...(storedObj.voz || {})
      }
    };
  }
  return defaults;
}

/**
 * Guarda la configuración unificada en localStorage
 */
export function guardarConfigChatWii(config) {
  savels('chatwii_config', config);
  
  if (config.apiKey !== undefined) localStorage.setItem('gemini_api_key', config.apiKey);
  if (config.modeloTexto !== undefined) localStorage.setItem('gemini_model', config.modeloTexto);
  if (config.voz) {
    if (config.voz.activa !== undefined) {
      savels('chatwii_voz_activa', config.voz.activa);
      savels('voz_chatwii', config.voz.activa);
    }
    if (config.voz.modelo !== undefined) savels('chatwii_voz_modelo', config.voz.modelo);
    if (config.voz.proveedor !== undefined) savels('chatwii_voz_proveedor', config.voz.proveedor);
    if (config.voz.tipo !== undefined) savels('chatwii_voz_tipo', config.voz.tipo);
  }
}

export function arrancar(panel) {
  const config = obtenerConfigChatWii();

  let saludoDefecto = '¡Buenas noches!';
  try {
    saludoDefecto = saludoSmile() || '¡Buenas noches!';
  } catch (_) {}

  const textoPruebaInicial = `${saludoDefecto} Soy Pancita, tu asistente personal de IA. Estoy lista para ayudarte con tu música, horarios y actividades.`;

  panel.innerHTML = `
    <div class="chatwii_config_wrapper">
      
      <!-- FILA SUPERIOR: 2 COLUMNAS (50% APIs Texto / 50% Voz Alexa) -->
      <div class="chatwii_top_grid">
        
        <!-- CARD 1 (50%): Configuración de APIs (Texto) -->
        <div class="cuenta_card">
          <div>
            <h2 class="cuenta_card_tit"><i class="fa-solid fa-cubes"></i> Configuración de APIs (Texto)</h2>
            
            <div class="cuenta_form_grp">
              <label for="cuenta_gemini_key"><i class="fa-solid fa-key"></i> Clave API de Gemini</label>
              <div class="cuenta_pass_wrap">
                <input type="password" id="cuenta_gemini_key" value="${config.apiKey}" placeholder="AIzaSy..." data-witip="Ingresa tu clave privada de Google AI Studio">
                <button type="button" class="cuenta_pass_eye" data-target="cuenta_gemini_key" data-witip="Mostrar u ocultar clave API">
                  <i class="fa-solid fa-eye-slash"></i>
                </button>
              </div>
              <p class="cuenta_form_tip">Obtén tu clave en <a href="https://aistudio.google.com/api-keys" target="_blank" class="cuenta_api_link" data-witip="Abrir consola de Google AI Studio"><i class="fa-solid fa-up-right-from-square cuenta_api_link_icon"></i> Google AI Studio</a>.</p>
            </div>

            <div class="cuenta_form_grp">
              <label for="cuenta_gemini_model"><i class="fa-solid fa-brain"></i> Modelo Gemini Principal</label>
              <select id="cuenta_gemini_model" class="cuenta_form_select" data-witip="Modelo preferido para respuestas de texto">
                <option value="gemini-3.1-flash-lite" ${config.modeloTexto === 'gemini-3.1-flash-lite' ? 'selected' : ''}>gemini-3.1-flash-lite (Por Defecto - Ultra Rápido)</option>
                <option value="gemini-3.1-flash" ${config.modeloTexto === 'gemini-3.1-flash' ? 'selected' : ''}>gemini-3.1-flash (Flash v3.1)</option>
                <option value="gemini-2.5-flash" ${config.modeloTexto === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (Flash v2.5)</option>
                <option value="gemini-2.5-pro" ${config.modeloTexto === 'gemini-2.5-pro' ? 'selected' : ''}>gemini-2.5-pro (Inteligencia Superior)</option>
                <option value="gemini-2.0-flash" ${config.modeloTexto === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Flash v2)</option>
              </select>
              <p class="cuenta_form_tip">Modelo optimizado para baja latencia y cuota de 500 RPD.</p>
            </div>
          </div>

          <button id="cuenta_guardar_apis_btn" class="cuenta_btn" data-witip="Guardar toda la configuración de ChatWii en el objeto unificado chatwii_config"><i class="fa-solid fa-save"></i> Guardar Configuración ChatWii</button>
        </div>

        <!-- CARD 2 (50%): Asistente de Voz ("Tipo Alexa") con clase chat_cg_voz -->
        <div class="cuenta_card chat_cg_voz">
          <div>
            <h2 class="cuenta_card_tit"><i class="fa-solid fa-microphone-lines"></i> Asistente de Voz ("Tipo Alexa")</h2>

            <div class="cuenta_switch_wrap chat_cg_voz_switch">
              <span class="chat_cg_voz_switch_lbl" data-witip="Permite responder a 'Pancita pon música...'">
                <i class="fa-solid fa-tower-broadcast"></i> Habilitar Comandos de Voz ("Pancita pon música...")
              </span>
              <label class="cuenta_switch" data-witip="Activa o desactiva la función de micrófono Alexa">
                <input type="checkbox" id="cuenta_voz_activa" ${config.voz.activa ? 'checked' : ''}>
                <span class="cuenta_slider"></span>
              </label>
            </div>

            <!-- Selector de Proveedor de Motor TTS -->
            <div class="cuenta_form_grp mt_1vh">
              <label for="cuenta_voice_provider"><i class="fa-solid fa-server"></i> Proveedor de Sintetizador Vocal</label>
              <select id="cuenta_voice_provider" class="cuenta_form_select" data-witip="Selecciona el servidor de generación de voz">
                ${PROVEEDORES_VOZ.map(p => `
                  <option value="${p.id}" ${config.voz.proveedor === p.id ? 'selected' : ''}>
                    ${p.nombre}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Selector Dinámico de Voz por Proveedor -->
            <div class="cuenta_form_grp mt_1vh">
              <label for="cuenta_voice_select"><i class="fa-solid fa-user-gear"></i> Selección de Voz Específica</label>
              <select id="cuenta_voice_select" class="cuenta_form_select" data-witip="Selecciona el timbre o locutor deseado">
              </select>
            </div>

            <!-- Textarea de Frase de Prueba Personalizada -->
            <div class="cuenta_form_grp mt_1vh">
              <label for="cuenta_voice_demo_text"><i class="fa-solid fa-comment-dots"></i> Frase de Demostración Hablada</label>
              <div class="cuenta_tts_tester_container">
                <textarea id="cuenta_voice_demo_text" class="cuenta_voice_demo_textarea" rows="2" data-witip="Escribe el texto que deseas escuchar al probar la voz">${textoPruebaInicial}</textarea>
                <button id="cuenta_probar_voz_tts_btn" type="button" class="chat_cg_voz_probador_btn" data-witip="Escuchar la demostración del texto arriba">
                  <i class="fa-solid fa-volume-high"></i> <span id="cuenta_probar_voz_lbl">Escuchar Frase de Prueba</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Probador de Micrófono en Tiempo Real Estilizado -->
          <div class="cuenta_mic_tester chat_cg_voz_mic_box">
            <div class="chat_cg_voz_mic_header">
              <button id="cuenta_probar_mic_btn" type="button" class="cuenta_btn_sec chat_cg_voz_mic_btn" data-witip="Prueba el volumen de entrada del micrófono en tiempo real">
                <i class="fa-solid fa-microphone" id="cuenta_probar_mic_icon"></i> <span id="cuenta_probar_mic_lbl">Probar Micrófono</span>
              </button>
              <span id="cuenta_mic_status" class="chat_cg_voz_status">Probar nivel de audio</span>
            </div>

            <div class="cuenta_mic_meter chat_cg_voz_meter" data-witip="Nivelador VU-Meter en tiempo real">
              <div id="cuenta_mic_bar" class="cuenta_mic_bar chat_cg_voz_bar"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- ÁREA INFERIOR: FULL WIDTH (100%) -->
      <div class="chatwii_bottom_full">
        <div class="cuenta_card">
          <h2 class="cuenta_card_tit"><i class="fa-solid fa-chart-simple"></i> Estado y Métricas</h2>
          
          <div class="chatwii_metrics_grid">
            <div class="cuenta_metric_row" data-witip="Estado de activación de la API Key">
              <span class="cuenta_metric_lbl"><i class="fa-solid fa-signal"></i> Estado Key:</span>
              <span class="cuenta_metric_val" id="cuenta_metric_estado">—</span>
            </div>
            
            <div class="cuenta_metric_row" data-witip="Límite de solicitudes diarias en Free Tier">
              <span class="cuenta_metric_lbl"><i class="fa-solid fa-chart-pie"></i> Peticiones Hoy:</span>
              <span class="cuenta_metric_val is_mono" id="cuenta_metric_peticiones">0 / 60</span>
            </div>

            <div class="cuenta_metric_row" data-witip="Modelo seleccionado para respuestas de chat escrito">
              <span class="cuenta_metric_lbl"><i class="fa-solid fa-microchip"></i> Modelo Texto:</span>
              <span class="cuenta_metric_val" id="cuenta_metric_modelo">—</span>
            </div>

            <div class="cuenta_metric_row" data-witip="Modelo seleccionado para comandos vocales">
              <span class="cuenta_metric_lbl"><i class="fa-solid fa-waveform"></i> Motor Voz:</span>
              <span class="cuenta_metric_val" id="cuenta_metric_voz_modelo">—</span>
            </div>

            <div class="cuenta_metric_row" data-witip="Plan de facturación estimado">
              <span class="cuenta_metric_lbl"><i class="fa-solid fa-receipt"></i> Costo Estimado:</span>
              <span class="cuenta_metric_val is_success">Gratuito (Free Tier)</span>
            </div>

            <div class="cuenta_metric_row" data-witip="Tiempo estimado de respuesta">
              <span class="cuenta_metric_lbl"><i class="fa-solid fa-gauge-high"></i> Latencia Media:</span>
              <span class="cuenta_metric_val is_dulce">&lt; 0.5s</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // 1. Inicializar tooltips wiTip de widev
  wiTip();

  // 2. Elementos DOM
  const selectModel = panel.querySelector('#cuenta_gemini_model');
  const selectProvider = panel.querySelector('#cuenta_voice_provider');
  const selectVoice = panel.querySelector('#cuenta_voice_select');
  const demoTextarea = panel.querySelector('#cuenta_voice_demo_text');

  // Llenar el selector de voces dinámicamente según el proveedor seleccionado
  const actualizarOpcionesVoces = (provId, vozSeleccionadaId) => {
    if (!selectVoice) return;
    const lista = obtenerVocesPorProveedor(provId);
    selectVoice.innerHTML = lista.map(v => `
      <option value="${v.id}" ${v.id === vozSeleccionadaId ? 'selected' : ''}>
        ${v.nombre}
      </option>
    `).join('');
  };

  actualizarOpcionesVoces(config.voz.proveedor, config.voz.tipo);

  // Inicializar wiSelect
  if (selectModel) wiSelect(selectModel, { placeholder: 'Selecciona modelo texto...' });
  if (selectProvider) {
    wiSelect(selectProvider, {
      placeholder: 'Selecciona proveedor...',
      onChange: (val) => {
        actualizarOpcionesVoces(val, null);
      }
    });
  }
  if (selectVoice) wiSelect(selectVoice, { placeholder: 'Selecciona voz...' });

  // 3. Botón para probar la demostración de la voz hablada con el texto del textarea
  const btnProbarVozTTS = panel.querySelector('#cuenta_probar_voz_tts_btn');
  const lblProbarVoz = panel.querySelector('#cuenta_probar_voz_lbl');
  let reproduciendoDemo = false;

  if (btnProbarVozTTS) {
    btnProbarVozTTS.addEventListener('click', () => {
      if (reproduciendoDemo) {
        reproduciendoDemo = false;
        detenerAudioHablado();
        if (lblProbarVoz) lblProbarVoz.textContent = 'Escuchar Frase de Prueba';
        Mensaje('Demostración detenida.', 'info');
        return;
      }

      const provId = selectProvider ? selectProvider.value : 'azure';
      const vozId = selectVoice ? selectVoice.value : 'es-MX-DaliaNeural';
      const texto = demoTextarea ? demoTextarea.value.trim() : textoPruebaInicial;

      reproduciendoDemo = true;
      if (lblProbarVoz) lblProbarVoz.textContent = 'Detener Audio';
      Mensaje(`Reproduciendo frase con motor ${provId.toUpperCase()}...`, 'info');

      probarDemostrasionVozCustom(texto, provId, vozId, () => {
        reproduciendoDemo = false;
        if (lblProbarVoz) lblProbarVoz.textContent = 'Escuchar Frase de Prueba';
        Mensaje('Demostración de audio finalizada.', 'success');
      });
    });
  }

  // 4. Alternar visibilidad de contraseña
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

  // 5. Listener de cambio directo en el switch de voz
  const switchVoz = panel.querySelector('#cuenta_voz_activa');
  if (switchVoz) {
    switchVoz.addEventListener('change', () => {
      const currentConfig = obtenerConfigChatWii();
      currentConfig.voz.activa = switchVoz.checked;
      guardarConfigChatWii(currentConfig);
      Mensaje(`Asistente de voz ${switchVoz.checked ? 'activado' : 'desactivado'}.`, 'info');
    });
  }

  // 6. Probador de Micrófono en Tiempo Real
  let probandoMic = false;
  const btnMic = panel.querySelector('#cuenta_probar_mic_btn');
  const micIcon = panel.querySelector('#cuenta_probar_mic_icon');
  const micLbl = panel.querySelector('#cuenta_probar_mic_lbl');
  const micBar = panel.querySelector('#cuenta_mic_bar');
  const micStatus = panel.querySelector('#cuenta_mic_status');

  if (btnMic) {
    btnMic.addEventListener('click', async () => {
      if (!probandoMic) {
        probandoMic = true;
        btnMic.classList.add('active');
        if (micIcon) micIcon.className = 'fa-solid fa-microphone-slash';
        if (micLbl) micLbl.textContent = 'Detener Prueba';
        if (micStatus) micStatus.textContent = 'Midiendo audio...';
        
        Mensaje('Iniciando prueba de micrófono en vivo. Habla ahora.', 'info');

        const ok = await probarMicrofono(
          (pct) => {
            if (micBar) micBar.style.width = `${pct}%`;
          },
          (err) => {
            probandoMic = false;
            btnMic.classList.remove('active');
            if (micIcon) micIcon.className = 'fa-solid fa-microphone';
            if (micLbl) micLbl.textContent = 'Probar Micrófono';
            if (micStatus) micStatus.textContent = `Error: ${err}`;
            if (micBar) micBar.style.width = '0%';
            Mensaje(`Error al probar micrófono: ${err}`, 'error');
          }
        );

        if (!ok) {
          probandoMic = false;
          btnMic.classList.remove('active');
          if (micIcon) micIcon.className = 'fa-solid fa-microphone';
          if (micLbl) micLbl.textContent = 'Probar Micrófono';
        }
      } else {
        probandoMic = false;
        detenerPruebaMicrofono();
        btnMic.classList.remove('active');
        if (micIcon) micIcon.className = 'fa-solid fa-microphone';
        if (micLbl) micLbl.textContent = 'Probar Micrófono';
        if (micStatus) micStatus.textContent = 'Prueba finalizada';
        if (micBar) micBar.style.width = '0%';
        Mensaje('Prueba de micrófono finalizada.', 'success');
      }
    });
  }

  // Limpiar recursos al desmontar
  panel._cleanupMic = () => {
    detenerPruebaMicrofono();
    detenerAudioHablado();
  };

  // 7. Actualizar Métricas
  const actualizarMetricas = () => {
    const keyInput = panel.querySelector('#cuenta_gemini_key');
    const keyVal = keyInput?.value.trim() || '';

    const estadoEl = panel.querySelector('#cuenta_metric_estado');
    if (estadoEl) {
      estadoEl.innerHTML = keyVal
        ? '<span class="cuenta_metric_badge success"><i class="fa-solid fa-circle-check"></i> Activo</span>'
        : '<span class="cuenta_metric_badge danger"><i class="fa-solid fa-circle-xmark"></i> Inactivo</span>';
    }

    const peticionesEl = panel.querySelector('#cuenta_metric_peticiones');
    if (peticionesEl) {
      const s = JSON.parse(localStorage.getItem('limiteHoy_chatwii_pancita_uses')) || { n: 0 };
      peticionesEl.textContent = `${s.n || 0} / 60`;
    }

    const currentConfig = obtenerConfigChatWii();

    const modeloEl = panel.querySelector('#cuenta_metric_modelo');
    if (modeloEl) {
      modeloEl.innerHTML = `<span class="cuenta_model_chip">${currentConfig.modeloTexto}</span>`;
    }

    const vozModeloEl = panel.querySelector('#cuenta_metric_voz_modelo');
    if (vozModeloEl) {
      vozModeloEl.innerHTML = `<span class="cuenta_model_chip">${currentConfig.voz.proveedor.toUpperCase()} (${currentConfig.voz.tipo})</span>`;
    }
  };

  actualizarMetricas();

  // 8. Guardar Configuración Unificada
  const guardarApis = () => {
    const keyInput = panel.querySelector('#cuenta_gemini_key');
    const switchVoz = panel.querySelector('#cuenta_voz_activa');

    const modelVal = selectModel ? selectModel.value : MODELO_PRINCIPAL;
    const voiceProvVal = selectProvider ? selectProvider.value : 'azure';
    const voiceVal = selectVoice ? selectVoice.value : 'es-MX-DaliaNeural';
    const keyVal = keyInput?.value.trim() || '';
    const vozActiva = switchVoz ? switchVoz.checked : false;

    const nuevaConfig = {
      apiKey: keyVal,
      modeloTexto: modelVal,
      voz: {
        activa: vozActiva,
        modelo: 'gemini-3-flash-live',
        proveedor: voiceProvVal,
        tipo: voiceVal
      }
    };

    guardarConfigChatWii(nuevaConfig);
    actualizarMetricas();
    Mensaje('¡Configuración unificada chatwii_config guardada correctamente!', 'success');
  };

  const btnGuardarApis = panel.querySelector('#cuenta_guardar_apis_btn');
  if (btnGuardarApis) {
    btnGuardarApis.addEventListener('click', guardarApis);
  }

  panel._guardarAccion = guardarApis;
}

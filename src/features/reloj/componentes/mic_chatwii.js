// src/features/reloj/componentes/mic_chatwii.js
// Componente de micrófono Alexa en el Reloj — Activación por clic con notificación Mensaje() del comando detectado

import { Mensaje, getls } from '@widev';
import { iniciarEscuchaVoz, detenerEscuchaVoz } from '../../chatwii/lib/voz_asistente.js';
import { procesarComandoVozAlexa } from '../../chatwii/lib/voz_comandos.js';
import './mic_chatwii.css';

let _escuchandoReloj = false;

/**
 * Devuelve el marcado HTML para el botón del micrófono Alexa
 */
export function renderMicChatwii() {
  return `
    <button type="button" class="mic_chatwii_btn" id="reloj_mic_alexa_btn">
      <i class="fa-solid fa-microphone" id="reloj_mic_alexa_icon"></i>
    </button>
  `;
}

/**
 * Registra los eventos e interactividad del micrófono al hacer clic
 */
export function initMicChatwiiEvents(parentEl) {
  const btn = parentEl ? parentEl.querySelector('#reloj_mic_alexa_btn') : document.getElementById('reloj_mic_alexa_btn');
  const icon = parentEl ? parentEl.querySelector('#reloj_mic_alexa_icon') : document.getElementById('reloj_mic_alexa_icon');

  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Verificar preferencia de activación en chatwii_config
    const config = getls('chatwii_config') || {};
    const vozActiva = config.voz?.activa ?? getls('chatwii_voz_activa') ?? getls('voz_chatwii') ?? true;

    if (!vozActiva) {
      Mensaje('Asistente de voz desactivado.', 'warning');
      return;
    }

    if (!_escuchandoReloj) {
      _escuchandoReloj = true;
      btn.classList.add('listening');
      if (icon) icon.className = 'fa-solid fa-waveform';

      Mensaje('Escuchando... Habla ahora', 'info');

      iniciarEscuchaVoz({
        onInicio: () => {
          btn.classList.add('listening');
        },
        onResultado: (transcripcion, esFinal) => {
          if (esFinal && transcripcion) {
            _escuchandoReloj = false;
            btn.classList.remove('listening');
            if (icon) icon.className = 'fa-solid fa-microphone';
            detenerEscuchaVoz();

            // Notificación visual con Mensaje() del comando detectado
            Mensaje(`Comando detectado: "${transcripcion}"`, 'success');
            procesarComandoVozAlexa(transcripcion);
          }
        },
        onError: (err) => {
          _escuchandoReloj = false;
          btn.classList.remove('listening');
          if (icon) icon.className = 'fa-solid fa-microphone';
          detenerEscuchaVoz();
          Mensaje(`Error de micrófono: ${err}`, 'error');
        },
        onFinal: () => {
          if (_escuchandoReloj) {
            _escuchandoReloj = false;
            btn.classList.remove('listening');
            if (icon) icon.className = 'fa-solid fa-microphone';
          }
        }
      });

    } else {
      _escuchandoReloj = false;
      btn.classList.remove('listening');
      if (icon) icon.className = 'fa-solid fa-microphone';
      detenerEscuchaVoz();
      Mensaje('Micrófono apagado.', 'info');
    }
  });
}

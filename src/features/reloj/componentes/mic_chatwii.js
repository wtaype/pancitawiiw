// src/features/reloj/componentes/mic_chatwii.js
// Switch Maestro de Privacidad / Escucha Manos Libres ("Ey Pancita") para el Widget del Reloj

import { Mensaje, getls, savels } from '@widev';
import { toggleWakeWordEngine, iniciarWakeWordEngine } from '../../chatwii/lib/wake_word.js';
import './mic_chatwii.css';

/**
 * Devuelve el marcado HTML para el botón de micrófono en el Reloj
 */
export function renderMicChatwii() {
  const activo = getls('chatwii_wake_word_active') ?? true;
  return `
    <button type="button" class="mic_chatwii_btn ${activo ? 'listening' : ''}" id="reloj_mic_alexa_btn">
      <i class="fa-solid fa-microphone${activo ? '' : '-slash'}" id="reloj_mic_alexa_icon"></i>
    </button>
  `;
}

/**
 * Registra los eventos e interactividad del switch maestro manos libres
 */
export function initMicChatwiiEvents(parentEl) {
  const btn = parentEl ? parentEl.querySelector('#reloj_mic_alexa_btn') : document.getElementById('reloj_mic_alexa_btn');
  const icon = parentEl ? parentEl.querySelector('#reloj_mic_alexa_icon') : document.getElementById('reloj_mic_alexa_icon');

  if (!btn) return;

  const activoGuardado = getls('chatwii_wake_word_active') ?? true;
  if (activoGuardado) {
    iniciarWakeWordEngine();
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    const actualmenteActivo = btn.classList.contains('listening');
    const nuevoEstado = !actualmenteActivo;

    if (nuevoEstado) {
      btn.classList.add('listening');
      if (icon) icon.className = 'fa-solid fa-microphone';
      toggleWakeWordEngine(true);
      Mensaje('Escucha manos libres activada. Di "Ey Pancita" en cualquier momento.', 'success');
    } else {
      btn.classList.remove('listening');
      if (icon) icon.className = 'fa-solid fa-microphone-slash';
      toggleWakeWordEngine(false);
      Mensaje('Micrófono silenciado. Escucha de "Pancita" pausada.', 'info');
    }
  });
}

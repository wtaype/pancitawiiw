// src/features/chatwii/lib/wake_word.js
// Motor de Detección de Palabra de Activación Manos Libres ("Ey Pancita") — 100% Gratis y Local

import { getls, savels, Mensaje } from '@widev';
import { procesarComandoVozAlexa } from './voz_comandos.js';

let _wakeRecognition = null;
let _wakeActive = false;
let _cooldownTimer = null;
let _enProcesoComando = false;

/**
 * Genera un tono sutil de disparo neón en Web Audio API cuando reconoce "Pancita"
 */
function reproducirChimeActivacion() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}

/**
 * Inicia el motor de escucha en segundo plano de la palabra clave "Pancita"
 */
export function iniciarWakeWordEngine() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;

  detenerWakeWordEngine();

  _wakeActive = true;
  _wakeRecognition = new SpeechRecognition();
  _wakeRecognition.continuous = true;
  _wakeRecognition.interimResults = true;
  _wakeRecognition.lang = 'es-ES';

  _wakeRecognition.onresult = (event) => {
    if (_enProcesoComando) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.toLowerCase().trim();

      if (/pancita|ey pancita|hey pancita|hola pancita/i.test(transcript)) {
        _enProcesoComando = true;
        reproducirChimeActivacion();

        // Extraer comando directo posterior a "pancita" si existiera
        const orden = transcript.replace(/.*?(pancita|ey pancita|hey pancita|hola pancita)/gi, '').trim();

        if (orden && orden.length > 2) {
          Mensaje(`¡Escuché "Pancita"! Ejecutando: "${orden}"`, 'success');
          procesarComandoVozAlexa(orden);
        } else {
          Mensaje('¡Pancita te escucha! ¿Qué deseas hacer?', 'info');
        }

        // Cooldown de 3 segundos para evitar disparos en bucle
        clearTimeout(_cooldownTimer);
        _cooldownTimer = setTimeout(() => {
          _enProcesoComando = false;
        }, 3000);

        break;
      }
    }
  };

  _wakeRecognition.onerror = (err) => {
    if (err.error === 'no-speech' || err.error === 'aborted') return;
    console.warn('[WakeWord Engine]:', err.error);
  };

  _wakeRecognition.onend = () => {
    // Reiniciar automáticamente el motor si la escucha permanece activa
    if (_wakeActive) {
      setTimeout(() => {
        try {
          if (_wakeActive && _wakeRecognition) _wakeRecognition.start();
        } catch (_) {}
      }, 400);
    }
  };

  try {
    _wakeRecognition.start();
    return true;
  } catch (e) {
    console.warn('Error al iniciar WakeWord engine:', e);
    return false;
  }
}

/**
 * Detiene el motor de escucha en segundo plano
 */
export function detenerWakeWordEngine() {
  _wakeActive = false;
  if (_wakeRecognition) {
    try { _wakeRecognition.stop(); } catch (_) {}
    _wakeRecognition = null;
  }
}

/**
 * Alterna o sincroniza el estado de escucha de la palabra clave "Pancita"
 */
export function toggleWakeWordEngine(activar) {
  savels('chatwii_wake_word_active', activar);
  if (activar) {
    iniciarWakeWordEngine();
  } else {
    detenerWakeWordEngine();
  }
}

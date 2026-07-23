// src/features/chatwii/lib/voz_asistente.js
// Motor de Asistente de Voz Conversacional — Reconocimiento STT, Síntesis TTS y Probador VU Meter de Micrófono en Vivo

import { getls } from '@widev';
import { MODELO_PRINCIPAL_VOZ } from '../brain.js';

let _recognition = null;
let _audioCtx = null;
let _micStream = null;
let _analyser = null;
let _testAnimFrame = null;

/**
 * Inicia la escucha de voz en tiempo real con Web Speech API
 */
export function iniciarEscuchaVoz({ onInicio, onResultado, onError, onFinal }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('Tu navegador o entorno no soporta reconocimiento de voz WebSpeech.');
    return null;
  }

  if (_recognition) {
    try { _recognition.stop(); } catch (_) {}
  }

  _recognition = new SpeechRecognition();
  _recognition.lang = 'es-ES';
  _recognition.interimResults = true;
  _recognition.maxAlternatives = 1;

  _recognition.onstart = () => {
    if (onInicio) onInicio();
  };

  _recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    const esFinal = event.results[event.results.length - 1].isFinal;
    if (onResultado) onResultado(transcript, esFinal);
  };

  _recognition.onerror = (event) => {
    if (onError) onError(event.error || 'Error de micrófono');
  };

  _recognition.onend = () => {
    if (onFinal) onFinal();
  };

  try {
    _recognition.start();
  } catch (err) {
    if (onError) onError(err.message);
  }

  return _recognition;
}

/**
 * Detiene la escucha de voz activa
 */
export function detenerEscuchaVoz() {
  if (_recognition) {
    try { _recognition.stop(); } catch (_) {}
    _recognition = null;
  }
}

/**
 * Probador de micrófono en tiempo real (VU Meter para la card en chatwii_config.js)
 */
export async function probarMicrofono(onVolume, onError) {
  detenerPruebaMicrofono();

  try {
    _micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = _audioCtx.createMediaStreamSource(_micStream);
    _analyser = _audioCtx.createAnalyser();
    _analyser.fftSize = 256;
    source.connect(_analyser);

    const bufferLength = _analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!_analyser) return;
      _analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const pct = Math.min(100, Math.round((average / 128) * 100));
      if (onVolume) onVolume(pct);
      _testAnimFrame = requestAnimationFrame(updateVolume);
    };

    updateVolume();
    return true;
  } catch (err) {
    if (onError) onError(err.message || 'Permiso de micrófono denegado o dispositivo no disponible.');
    detenerPruebaMicrofono();
    return false;
  }
}

/**
 * Detiene la prueba de micrófono y libera los recursos del sistema
 */
export function detenerPruebaMicrofono() {
  if (_testAnimFrame) {
    cancelAnimationFrame(_testAnimFrame);
    _testAnimFrame = null;
  }
  if (_micStream) {
    _micStream.getTracks().forEach(track => track.stop());
    _micStream = null;
  }
  if (_audioCtx) {
    try { _audioCtx.close(); } catch (_) {}
    _audioCtx = null;
  }
  _analyser = null;
}

/**
 * Reproduce texto sintetizado en voz alta (TTS estilo Alexa)
 */
export function decirTextoEnVozAlta(texto, onEnd) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'es-ES';
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Clasifica y procesa comandos de voz inteligentes ("Pancita, pon música...")
 */
export function procesarComandoVozInteligente(transcripcion) {
  if (!transcripcion || typeof transcripcion !== 'string') return null;

  const texto = transcripcion.trim().toLowerCase();

  // Comando Alexa para Reproducción de Música
  if (/pon música|reproducir|poner canción|escuchar|reproduce/i.test(texto)) {
    let busqueda = texto
      .replace(/pancita/gi, '')
      .replace(/pon música|reproducir|poner canción|escuchar|reproduce/gi, '')
      .replace(/de|para|un|una|el|la/gi, '')
      .trim();

    const event = new CustomEvent('pancita_comando_musica', {
      detail: { busqueda: busqueda || 'lofi' }
    });
    window.dispatchEvent(event);

    const respuestaAudio = busqueda 
      ? `¡Claro! Buscando y reproduciendo ${busqueda} para ti.` 
      : '¡Por supuesto! Iniciando tu música.';

    decirTextoEnVozAlta(respuestaAudio);
    return { tipo: 'musica', termino: busqueda, respuesta: respuestaAudio };
  }

  return null;
}

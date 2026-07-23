// src/features/chatwii/lib/voz_asistente.js
// Motor de Asistente de Voz Conversacional — Soporte Multi-Proveedor (Azure Neural, Google Cloud TTS, ElevenLabs y WebSpeech)

import { getls, saludoSmile } from '@widev';
import { AZURE_TTS_KEY, AZURE_TTS_REGION, GOOGLE_TTS_KEY, PUBLIC_ELEVEN_LABS } from '../../../env.js';
import { obtenerVozPorId } from './lista_voces.js';

let _recognition = null;
let _audioCtx = null;
let _micStream = null;
let _analyser = null;
let _testAnimFrame = null;
let _currentAudioEl = null;

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
 * Probador de micrófono en tiempo real (VU Meter)
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
 * Detiene la prueba de micrófono y libera recursos
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
 * Detiene la reproducción de audio hablada en curso
 */
export function detenerAudioHablado() {
  if (_currentAudioEl) {
    try {
      _currentAudioEl.pause();
      _currentAudioEl.currentTime = 0;
    } catch (_) {}
    _currentAudioEl = null;
  }
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }
}

/**
 * Reproduce audio utilizando Microsoft Azure Speech Neural REST API
 */
async function reproducirAzureNeural(texto, vozId, onEnd, onError) {
  const region = AZURE_TTS_REGION || 'eastus';
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const cleanText = texto.replace(/<[^>]*>/g, '').trim();

  const ssml = `<speak version='1.0' xml:lang='es-MX'><voice xml:lang='es-MX' name='${vozId}'>${cleanText}</voice></speak>`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_TTS_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
      },
      body: ssml
    });

    if (!res.ok) throw new Error(`Azure TTS HTTP ${res.status}`);

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    detenerAudioHablado();
    _currentAudioEl = new Audio(audioUrl);
    _currentAudioEl.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };
    await _currentAudioEl.play();
    return true;
  } catch (err) {
    console.warn('[Azure TTS Fallback a WebSpeech]:', err);
    if (onError) onError(err);
    return false;
  }
}

/**
 * Reproduce audio utilizando Google Cloud TTS REST API
 */
async function reproducirGoogleTTS(texto, vozId, lang, onEnd, onError) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: texto },
        voice: { languageCode: lang || 'es-ES', name: vozId },
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

    if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`);

    const data = await res.json();
    if (!data.audioContent) throw new Error('Sin audioContent de Google');

    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
    detenerAudioHablado();
    _currentAudioEl = new Audio(audioUrl);
    _currentAudioEl.onended = () => {
      if (onEnd) onEnd();
    };
    await _currentAudioEl.play();
    return true;
  } catch (err) {
    console.warn('[Google TTS Fallback a WebSpeech]:', err);
    if (onError) onError(err);
    return false;
  }
}

/**
 * Reproduce audio utilizando ElevenLabs REST API
 */
async function reproducirElevenLabs(texto, vozId, onEnd, onError) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${vozId}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': PUBLIC_ELEVEN_LABS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texto,
        model_id: 'eleven_multilingual_v2'
      })
    });

    if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}`);

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    detenerAudioHablado();
    _currentAudioEl = new Audio(audioUrl);
    _currentAudioEl.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };
    await _currentAudioEl.play();
    return true;
  } catch (err) {
    console.warn('[ElevenLabs Fallback a WebSpeech]:', err);
    if (onError) onError(err);
    return false;
  }
}

/**
 * Reproducción de voz local WebSpeech (Fallback local)
 */
function reproducirWebSpeech(texto, vozId, onEnd) {
  if (!('speechSynthesis' in window)) return;

  detenerAudioHablado();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'es-ES';
  
  if (vozId === 'ws-es-ES-masculino') {
    utterance.pitch = 0.72;
    utterance.rate = 0.95;
  } else {
    utterance.pitch = 1.2;
    utterance.rate = 1.02;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Orquestador Global de Síntesis Vocal (Azure, Google, ElevenLabs o WebSpeech)
 */
export async function decirTextoEnVozAlta(texto, proveedorForzado = null, vozIdForzada = null, onEnd = null) {
  const config = getls('chatwii_config') || {};
  const proveedor = proveedorForzado || config.voz?.proveedor || 'azure';
  const vozId = vozIdForzada || config.voz?.tipo || 'es-MX-DaliaNeural';

  const vozMeta = obtenerVozPorId(vozId);

  // 1. Intentar Azure Neural (Recomendado)
  if (proveedor === 'azure' && AZURE_TTS_KEY) {
    const ok = await reproducirAzureNeural(texto, vozId, onEnd);
    if (ok) return;
  }

  // 2. Intentar Google Cloud TTS
  if (proveedor === 'google' && GOOGLE_TTS_KEY) {
    const ok = await reproducirGoogleTTS(texto, vozId, vozMeta.lang, onEnd);
    if (ok) return;
  }

  // 3. Intentar ElevenLabs
  if (proveedor === 'elevenlabs' && PUBLIC_ELEVEN_LABS) {
    const ok = await reproducirElevenLabs(texto, vozId, onEnd);
    if (ok) return;
  }

  // 4. Fallback local WebSpeech
  reproducirWebSpeech(texto, vozId, onEnd);
}

/**
 * Reproduce la prueba del texto personalizado en tiempo real
 */
export function probarDemostrasionVozCustom(textoPersonalizado, proveedor, vozId, onEnd) {
  let saludo = '¡Buenas noches!';
  try {
    saludo = saludoSmile() || '¡Buenas noches!';
  } catch (e) {
    console.warn('saludoSmile fallback:', e);
  }

  const textoFinal = textoPersonalizado || `${saludo} Soy Pancita, tu asistente personal de IA. Estoy lista para ayudarte.`;
  decirTextoEnVozAlta(textoFinal, proveedor, vozId, onEnd);
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

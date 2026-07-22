// src/features/chatwii/chat/brain.js
// Motor lógico de ChatWii — Conexión nativa con Rust, Canal IPC de Tauri v2 y Almacenamiento JSON
import { coachPersona } from './personalidad.js';
import { horarioDB } from '../../horario/lib/horario_db.js';
import { obtenerBloqueActual } from '../../horario/lib/horario_dev.js';
import { wiRateLimit, Notificacion } from '@widev';

let _historial = [];

export const initCoach = async () => {
  if (window.__TAURI__) {
    try {
      const saved = await window.__TAURI__.core.invoke('chatwii_cargar_historial');
      _historial = Array.isArray(saved) ? saved : [];
    } catch (err) {
      console.error('[ChatWii] Error al cargar historial desde Rust:', err);
      _historial = [];
    }
  } else {
    try {
      const saved = localStorage.getItem('chatwii_history_pancita');
      _historial = saved ? JSON.parse(saved) : [];
    } catch (_) {
      _historial = [];
    }
  }
  return _historial;
};

export const obtenerHistorial = () => _historial;

export const guardarHistorial = async () => {
  if (window.__TAURI__) {
    try {
      await window.__TAURI__.core.invoke('chatwii_guardar_historial', { historial: _historial });
    } catch (err) {
      console.error('[ChatWii] Error al guardar historial en Rust:', err);
    }
  } else {
    try {
      localStorage.setItem('chatwii_history_pancita', JSON.stringify(_historial));
    } catch (_) {}
  }
};

export const limpiarHistorial = async () => {
  _historial = [];
  await guardarHistorial();
};

export const enviarMensaje = async (textoUsuario, imagenesBase64, onChunk) => {
  // Límite de uso local (60 por día)
  const rate = wiRateLimit('chatwii_pancita_uses', 60, 'dia');
  if (!rate.ok) {
    Notificacion('Has alcanzado el límite de 60 respuestas diarias.', 'warning', 5000);
    throw new Error('Límite de uso alcanzado');
  }

  // Formato Gemini parts (las citas ya vienen formateadas en el textoUsuario desde el frontend)
  const parts = [{ text: textoUsuario }];
  
  // Agregar imágenes multimodales si existen (soportando objeto {base64, mime} o string directo)
  if (imagenesBase64 && imagenesBase64.length > 0) {
    imagenesBase64.forEach(img => {
      const srcData = typeof img === 'string' ? img : (img.base64 || '');
      const mimeType = typeof img === 'string' ? 'image/webp' : (img.mime || 'image/webp');
      if (srcData) {
        const base64Data = srcData.startsWith('data:') ? srcData.split(',')[1] : srcData;
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
    });
  }

  // Añadir al historial
  _historial.push({ role: 'user', parts });
  await guardarHistorial();

  // Obtener clave API y modelo personalizados desde Cuenta/Centro APIs
  const apiCustomKey = localStorage.getItem('gemini_api_key') || null;
  const selectModelVal = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';

  // Obtener contexto de productividad del Horario en Vivo
  const listaHorario = horarioDB.obtenerHorario();
  const bloqueActual = obtenerBloqueActual(listaHorario);
  const infoHorario = bloqueActual 
    ? `CONTEXTO HORARIO DEL USUARIO HOY:\n- Actividad en ejecución ahora: "${bloqueActual.titulo}" (${bloqueActual.horaInicio} a ${bloqueActual.horaFin}).`
    : `CONTEXTO HORARIO DEL USUARIO HOY:\n- El usuario está en tiempo libre y no tiene actividades programadas en este momento.`;

  // Construir la actitud o system instructions dinámicas
  const systemInstruction = `
${coachPersona.actitud.trim()}

${infoHorario}

INSTRUCCIONES EXTRA:
1. Sé consciente del horario en vivo del usuario provisto arriba. Si te preguntan qué deben estar haciendo, guíalos usando esta información de forma natural y motivadora.
2. Utiliza emojis alegres y de soporte (como 💡, 🌟, 🎒, 📘, 🌙, 😊, 🙌, 🚀) para sonar como un amigo cercano.
`.trim();

  // Si no está corriendo bajo Tauri
  if (!window.__TAURI__) {
    // Simulación fuera de Windows
    await new Promise(r => setTimeout(r, 1000));
    const responseSim = `¡Hola! Soy Pancita. Veo que me escribes desde el navegador. Para habilitar respuestas reales de Gemini, por favor abre Pancitawii en Windows o conecta la API Key. Tu horario indica que estás en: "${bloqueActual?.titulo || 'Tiempo Libre'}"`;
    for (const word of responseSim.split(' ')) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 60));
    }
    _historial.push({ role: 'model', parts: [{ text: responseSim }] });
    await guardarHistorial();
    return responseSim;
  }

  // Si está corriendo bajo Tauri v2
  const Channel = window.__TAURI__.core.Channel;
  if (!Channel) {
    throw new Error('Tauri IPC Channel no disponible');
  }

  const canal = new Channel();
  let respuestaCompleta = '';

  canal.onmessage = (chunk) => {
    respuestaCompleta += chunk;
    onChunk(chunk);
  };

  try {
    // LLamamos al comando unificado en Rust pasándole la clave y el modelo preferido
    await window.__TAURI__.core.invoke('completar_chat_comando', {
      historial: _historial,
      actitud: systemInstruction,
      customKey: apiCustomKey,
      canal
    });

    _historial.push({ role: 'model', parts: [{ text: respuestaCompleta }] });
    await guardarHistorial();
    return respuestaCompleta;
  } catch (err) {
    // Revertir último mensaje si falló
    _historial.pop();
    await guardarHistorial();
    throw err;
  }
};

export const obtenerSaludo = () => {
  const defaultSaludos = coachPersona.saludos.es;
  const randIdx = Math.floor(Math.random() * defaultSaludos.length);
  return defaultSaludos[randIdx];
};

export function agregarMensajeLocalAlHistorial(userText, modelText) {
  _historial.push({ role: 'user', parts: [{ text: userText }] });
  _historial.push({ role: 'model', parts: [{ text: modelText }] });
  guardarHistorial();
}

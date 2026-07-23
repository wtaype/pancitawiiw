// src/features/chatwii/brain.js
// Cerebro Central de ChatWii — Orquestador de IA, habilidades, prompts e IPC nativo

import { coachPersona, obtenerSystemInstruction } from './personalidad.js';
import { horarioDB } from '../horario/lib/horario_db.js';
import { obtenerBloqueActual } from '../horario/lib/horario_dev.js';
import { wiRateLimit, Notificacion, getls, savels } from '@widev';
import { obtenerContextoPlaylistParaIA } from './skills/dj_musica.js';
import { obtenerContextoHorario } from './skills/leer_horario.js';
import { obtenerContextoTiempoReal, obtenerActividadesHoyYManana, obtenerSaludoInteligente } from './lib/chatdev.js';
import {
  initEstadoChat,
  obtenerHistorial,
  guardarHistorial,
  limpiarHistorial,
  agregarMensajeUser,
  agregarMensajeModel,
  removerUltimoMensaje
} from './lib/estado_chat.js';

// Configuración centralizada de modelos de Inteligencia Artificial
export const MODELO_PRINCIPAL = 'gemini-3.1-flash-lite';
export const MODELOS_RESPALDO = [
  'gemini-3.1-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export const MODELO_PRINCIPAL_VOZ = 'gemini-3-flash-live';
export const MODELOS_SECUNDARIOS_VOZ = [
  'gemini-2.5-flash-native-audio',
  'gemini-3.1-flash-tts'
];

export const RECORDAR_MAX_MENSAJES = 10;

// Re-exportar funciones del estado
export { obtenerHistorial, guardarHistorial, limpiarHistorial };

export const initCoach = async () => {
  return await initEstadoChat();
};

export const enviarMensaje = async (textoUsuario, imagenesBase64, onChunk) => {
  // Límite de uso local (60 por día)
  const rate = wiRateLimit('chatwii_pancita_uses', 60, 'dia');
  if (!rate.ok) {
    Notificacion('Has alcanzado el límite de 60 respuestas diarias.', 'warning', 5000);
    throw new Error('Límite de uso alcanzado');
  }

  // Formato Gemini parts
  const parts = [{ text: textoUsuario }];
  
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

  // Añadir mensaje de usuario al estado
  await agregarMensajeUser(parts);

  // Clasificador de intención dinámico para acotar contexto
  const quiereMusica = /musica|música|cancion|canción|reproducir|play|escuchar|playlist|sonar|reproductor|temas|phonk|lofi|rock|pop|género/i.test(textoUsuario);
  const quiereAgenda = /horario|rutina|agenda|semana|calendario|hacer|tarea|actividad|mañana|hoy|lunes|martes|miércoles|jueves|viernes|sábado|domingo|pendiente/i.test(textoUsuario);

  const apiCustomKey = getls('gemini_api_key') || null;

  const perfil = getls('wiSmile');
  const nombreUsuario = perfil ? `${perfil.nombre} ${perfil.apellidos}` : 'Usuario';
  const primerNombre = perfil ? (perfil.nombre.trim().split(/\s+/)[0] || 'Usuario') : 'Usuario';

  const listaHorario = horarioDB.obtenerHorario();
  const bloqueActual = obtenerBloqueActual(listaHorario);
  const infoHorario = bloqueActual 
    ? `CONTEXTO HORARIO EN CURSO AHORA:\n- Actividad: "${bloqueActual.titulo}" (${bloqueActual.horaInicio} a ${bloqueActual.horaFin}).`
    : `CONTEXTO HORARIO EN CURSO AHORA:\n- El usuario está en tiempo libre y no tiene actividades programadas en este momento.`;

  const infoHorarioCompleto = quiereAgenda
    ? obtenerContextoHorario()
    : '[Horario: Agenda semanal completa no solicitada en este mensaje. El bloque activo actual es el provisto arriba].';

  const agendaInmediata = quiereAgenda
    ? obtenerActividadesHoyYManana()
    : '';

  const infoPlaylist = quiereMusica
    ? obtenerContextoPlaylistParaIA()
    : '[Música: Playlist no solicitada en este mensaje].';

  const systemInstruction = obtenerSystemInstruction(
    primerNombre,
    nombreUsuario,
    infoHorario,
    infoHorarioCompleto,
    infoPlaylist,
    obtenerContextoTiempoReal(),
    agendaInmediata
  );

  const historialAcotado = obtenerHistorial().slice(-RECORDAR_MAX_MENSAJES);

  // Si no está corriendo bajo Tauri
  if (!window.__TAURI__) {
    await new Promise(r => setTimeout(r, 600));
    const responseSim = `¡Hola! Soy Pancita. Veo que me escribes desde el navegador. Para habilitar respuestas reales de Gemini, abre Pancitawii en Windows o conecta la API Key. Tu horario indica que estás en: "${bloqueActual?.titulo || 'Tiempo Libre'}"`;
    for (const word of responseSim.split(' ')) {
      if (typeof onChunk === 'function') onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 40));
    }
    await agregarMensajeModel(responseSim);
    rate.fail();
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
    if (typeof onChunk === 'function') {
      onChunk(chunk);
    }
  };

  try {
    await window.__TAURI__.core.invoke('completar_chat_comando', {
      historial: historialAcotado,
      actitud: systemInstruction,
      customKey: apiCustomKey,
      canal
    });

    await agregarMensajeModel(respuestaCompleta);
    rate.fail();
    return respuestaCompleta;
  } catch (err) {
    await removerUltimoMensaje();
    throw err;
  }
};

export const obtenerSaludo = () => {
  return obtenerSaludoInteligente();
};

export function agregarMensajeLocalAlHistorial(userText, modelText) {
  agregarMensajeUser([{ text: userText }]);
  agregarMensajeModel(modelText);
}

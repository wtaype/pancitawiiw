// src/features/chatwii/lib/voz_comandos.js
// Enrutador inteligente de comandos vocales Alexa (Música + Horario + Gemini IA)

import { Mensaje, saludoSmile } from '@widev';
import { horarioDB } from '../../horario/lib/horario_db.js';
import { decirTextoEnVozAlta } from './voz_asistente.js';
import { 
  reproducirComandoVocalMusica, 
  pausarOReanudarMusica, 
  siguienteCancionVocal, 
  anteriorCancionVocal 
} from '../../musica/musica.js';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Procesa transcripciones habladas y las dirige a Música, Horario o Inteligencia Artificial
 */
export async function procesarComandoVozAlexa(transcripcion) {
  if (!transcripcion || typeof transcripcion !== 'string') return null;

  const rawText = transcripcion.trim();
  const text = rawText.toLowerCase();

  // ==========================================
  // 1. COMANDOS DE MÚSICA Y CONTROL COMPLETO
  // ==========================================
  if (/play|música|musica|canción|cancion|reproducir|poner|escuchar|reproduce|toca|tocar|pausa|detener|siguiente|anterior|next|prev|busca|buscar/i.test(text)) {
    
    // 1.1 CONTROL PAUSA / REANUDAR
    if (/pausa|pausar|detener|para la música|stop/i.test(text)) {
      pausarOReanudarMusica();
      decirTextoEnVozAlta('Música pausada.');
      return { tipo: 'musica_control', accion: 'pausa' };
    }

    // 1.2 CONTROL SIGUIENTE CANCIÓN
    if (/siguiente|siguiente canción|música siguiente|musica siguiente|next|pasa la canción|pasa canción/i.test(text)) {
      const tituloNext = siguienteCancionVocal();
      const msgNext = `Reproduciendo siguiente canción: ${tituloNext}`;
      decirTextoEnVozAlta(msgNext);
      return { tipo: 'musica_control', accion: 'siguiente', titulo: tituloNext };
    }

    // 1.3 CONTROL ANTERIOR CANCIÓN
    if (/anterior|canción anterior|cancion anterior|música anterior|musica anterior|prev|previous|regresa canción|atrás/i.test(text)) {
      const tituloPrev = anteriorCancionVocal();
      const msgPrev = `Reproduciendo canción anterior: ${tituloPrev}`;
      decirTextoEnVozAlta(msgPrev);
      return { tipo: 'musica_control', accion: 'anterior', titulo: tituloPrev };
    }

    // 1.4 BÚSQUEDA Y REPRODUCCIÓN (ej: "busca play música xxx", "busca música xxx", "play phonk", "pon Lil XXEL")
    let busqueda = text
      .replace(/pancita/gi, '')
      .replace(/busca play música|busca play musica|busca música|busca musica|buscar play música|buscar play musica|buscar música|buscar musica|busca|buscar/gi, '')
      .replace(/play música|play musica|play|pon música|pon musica|reproducir|poner canción|poner cancion|escuchar|reproduce|toca|tocar|pon/gi, '')
      .replace(/de|para|un|una|el|la|canción|cancion/gi, '')
      .trim();

    // Reproducción directa e inmediata en caliente del audio
    const tituloEncontrado = reproducirComandoVocalMusica(busqueda || 'lofi');

    const respuestaAudio = busqueda 
      ? `¡Claro! Reproduciendo ${tituloEncontrado || busqueda} para ti.` 
      : '¡Por supuesto! Iniciando tu música.';

    decirTextoEnVozAlta(respuestaAudio);
    return { tipo: 'musica', termino: busqueda, respuesta: respuestaAudio };
  }

  // ==========================================
  // 2. INTENCIÓN DE HORARIO Y AGENDA DIARIA
  // ==========================================
  if (/qué tengo que hacer|horario|mi agenda|mis actividades|qué hago hoy|qué viene ahora|actividades/i.test(text)) {
    try {
      const horario = horarioDB.obtenerHorario() || [];
      const hoy = new Date();
      const diaHoy = DIAS_SEMANA[hoy.getDay()];

      const actividadesHoy = horario
        .filter(b => b.dia === diaHoy)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      const saludo = saludoSmile() || '¡Hola!';

      if (actividadesHoy.length === 0) {
        const msgVacio = `${saludo} Hoy ${diaHoy} no tienes actividades programadas en tu horario. ¡Disfruta tu día libre!`;
        decirTextoEnVozAlta(msgVacio);
        return { tipo: 'horario', texto: msgVacio };
      }

      const resumenActividades = actividadesHoy
        .slice(0, 4)
        .map(a => `${a.titulo} a las ${a.horaInicio}`)
        .join(', ');

      const msgHorario = `${saludo} Hoy ${diaHoy} tienes ${actividadesHoy.length} actividades programadas: ${resumenActividades}.`;
      decirTextoEnVozAlta(msgHorario);
      return { tipo: 'horario', texto: msgHorario };
    } catch (e) {
      console.error('[voz_comandos] Error al consultar horario:', e);
      decirTextoEnVozAlta('No pude acceder a tu agenda en este momento.');
      return null;
    }
  }

  // ==========================================
  // 3. CONSULTA IA RÁPIDA
  // ==========================================
  const saludo = saludoSmile() || '¡Hola!';
  const msgGeneral = `${saludo} Escuché tu mensaje: "${rawText}". Estoy lista para ayudarte con tu música u horario.`;
  decirTextoEnVozAlta(msgGeneral);
  return { tipo: 'general', texto: msgGeneral };
}

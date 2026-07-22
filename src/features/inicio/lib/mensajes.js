// src/features/inicio/lib/mensajes.js
// Motor inteligente para generar avisos y recordatorios proactivos vinculados a la rutina

import { horarioDB } from '../../horario/lib/horario_db.js';
import { obtenerBloqueActual } from '../../horario/lib/horario_dev.js';
import { obtenerProgresoDia } from './progreso.js';

export function obtenerMensajesInteligentes() {
  const lista = horarioDB.obtenerHorario();
  const ahora = new Date();
  const horas = ahora.getHours();
  
  const diasEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const diaHoy = diasEsp[ahora.getDay()];
  const minsAhora = horas * 60 + ahora.getMinutes();

  let bloquesHoy = lista.filter(b => b.dia === diaHoy);
  if (bloquesHoy.length === 0) bloquesHoy = lista;

  let bloqueEnCurso = null;
  let bloqueProximo = null;

  for (const b of bloquesHoy) {
    const [hI, mI] = (b.horaInicio || '00:00').split(':').map(Number);
    const [hF, mF] = (b.horaFin || '00:00').split(':').map(Number);
    const startMins = hI * 60 + mI;
    let endMins = hF * 60 + mF;
    if (endMins < startMins) endMins += 24 * 60;

    if (minsAhora >= startMins && minsAhora < endMins) {
      bloqueEnCurso = { ...b, minsRestantes: endMins - minsAhora };
    } else if (minsAhora < startMins && !bloqueProximo) {
      bloqueProximo = { ...b, minsFaltantes: startMins - minsAhora };
    }
  }

  const mensajes = [];

  // 1. Alerta de Actividad Activa en Curso
  if (bloqueEnCurso) {
    mensajes.push(`En curso: ${bloqueEnCurso.titulo} (Quedan ${bloqueEnCurso.minsRestantes} min)`);
  }

  // 2. Alerta de Próxima Actividad con emojis contextuales
  if (bloqueProximo) {
    const minFaltan = bloqueProximo.minsFaltantes;
    const tit = (bloqueProximo.titulo || '').toLowerCase();
    
    let emoji = '🎒';
    if (tit.includes('dormir')) emoji = '🌙';
    else if (tit.includes('estudio') || tit.includes('universidad') || tit.includes('clase') || tit.includes('repaso')) emoji = '🎓';
    else if (tit.includes('trabajo')) emoji = '💼';
    else if (tit.includes('comer') || tit.includes('cena') || tit.includes('almuerzo') || tit.includes('desayuno')) emoji = '🍽️';

    if (minFaltan <= 60) {
      mensajes.push(`En ${minFaltan} min tienes que ${bloqueProximo.titulo} ${emoji}`);
    } else {
      mensajes.push(`Siguiente actividad: ${bloqueProximo.titulo} a las ${bloqueProximo.horaInicio} ${emoji}`);
    }
  } else if (!bloqueEnCurso) {
    mensajes.push('¡Completaste todas tus actividades de hoy! 🌙');
  }

  // 3. Estado de Progreso Diario
  const prog = obtenerProgresoDia();
  if (prog > 80) {
    mensajes.push(`Día al ${prog}%. ¡Excelente trabajo en tus metas! 🏆`);
  } else if (prog < 25) {
    mensajes.push(`Inicio del día (${prog}%). ¡A por todas hoy con tu rutina! ☀️`);
  } else {
    mensajes.push(`Progreso del día: ${prog}% completado. ¡Mantén el enfoque! 🚀`);
  }

  // 4. Consejos de Hábitos por Rango de Horas
  if (horas >= 6 && horas < 10) {
    mensajes.push('¿Ya tomaste tu desayuno saludable hoy? 🥞');
  }
  if (horas >= 18 && horas < 22) {
    mensajes.push('Cena ligero para conciliar mejor el sueño esta noche 🍕');
  }
  if (horas >= 22 || horas < 5) {
    mensajes.push('La luz azul de la pantalla dificulta el sueño. ¡Desconecta! 🌙');
  }

  // Recomendaciones fijas obligatorias
  mensajes.push('Recuerda tomar un vaso de agua 💧');
  mensajes.push('Estudia con bloques de 45 min y descansa 15 min 🧠');

  return mensajes;
}

// src/features/panel/reloj/mensajes_reloj.js
// Generador de Mensajes Inteligentes en Vivo conectados a horarioDB

import { horarioDB } from '../../horario/lib/horario_db.js';

export function obtenerAvisosHorarioEnVivo() {
  const lista = horarioDB.obtenerHorario();
  const ahora = new Date();
  const diasInglesEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const diaHoy = diasInglesEsp[ahora.getDay()];
  const minsAhora = ahora.getHours() * 60 + ahora.getMinutes();

  let bloquesHoy = lista.filter(b => b.dia === diaHoy);
  if (bloquesHoy.length === 0) bloquesHoy = lista;

  let bloqueEnCurso = null;
  let bloqueProximo = null;

  for (const b of bloquesHoy) {
    const [hI, mI] = (b.horaInicio || '00:00').split(':').map(Number);
    const [hF, mF] = (b.horaFin || '00:00').split(':').map(Number);
    const startMins = (hI || 0) * 60 + (mI || 0);
    let endMins = (hF || 0) * 60 + (mF || 0);
    if (endMins < startMins) endMins += 24 * 60;

    if (minsAhora >= startMins && minsAhora < endMins) {
      bloqueEnCurso = { ...b, minsRestantes: endMins - minsAhora };
    } else if (minsAhora < startMins && !bloqueProximo) {
      bloqueProximo = { ...b, minsFaltantes: startMins - minsAhora };
    }
  }

  const avisos = [];

  // 1. Mensaje de Actividad en Curso
  if (bloqueEnCurso) {
    avisos.push(`En curso: ${bloqueEnCurso.titulo} (Restan ${bloqueEnCurso.minsRestantes} min)`);
  }

  // 2. Mensaje de Próxima Actividad
  if (bloqueProximo) {
    if (bloqueProximo.minsFaltantes <= 60) {
      avisos.push(`En ${bloqueProximo.minsFaltantes} min empieza: ${bloqueProximo.titulo} (${bloqueProximo.horaInicio})`);
    } else {
      avisos.push(`Siguiente: ${bloqueProximo.titulo} a las ${bloqueProximo.horaInicio}`);
    }
  } else if (!bloqueEnCurso) {
    avisos.push('¡Completaste todas tus actividades de hoy! 🌙');
  }

  // 3. Consejos de Hábitos y Salud
  avisos.push('Recuerda tomar un vaso de agua 💧');
  avisos.push('¡Vas excelente en tus metas hoy! 🏆');
  avisos.push('Organiza tu horario semanal con Pancita 🎓');

  return avisos;
}

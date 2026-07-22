// src/features/horario/lib/horario_dev.js
// Motor matemático y reglas de negocio para el Horario Semanal (Pancitawii)

/**
 * Convierte un string de hora formato "HH:MM" (24h) a minutos desde la medianoche.
 * @param {string} horaStr 
 * @returns {number} Minutos transcurridos
 */
export function horaAMinutos(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return 0;
  const parts = horaStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Convierte un número de minutos en un formato de duración corto legible.
 * @param {number} minutos 
 * @returns {string} Duración formateada (ej. "1h 45m" o "30 min")
 */
export function formatearDuracion(minutos) {
  if (typeof minutos !== 'number' || minutos <= 0) return '0 min';
  const hrs = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${mins} min`;
}

/**
 * Detecta si un nuevo bloque horario interfiere/colisiona con bloques guardados el mismo día.
 * @param {Object} bloqueNuevo Bloque a verificar
 * @param {Array} bloquesExistentes Lista de todos los bloques
 * @param {string|null} editId ID del bloque actualmente editándose para omitirlo
 * @returns {Object|null} Retorna el bloque con el que choca, o null si no hay conflicto.
 */
export function detectarTraslape(bloqueNuevo, bloquesExistentes, editId = null) {
  if (!bloqueNuevo || !bloquesExistentes || !Array.isArray(bloquesExistentes)) return null;

  const startNuevo = horaAMinutos(bloqueNuevo.horaInicio);
  let endNuevo = horaAMinutos(bloqueNuevo.horaFin);
  
  // Si la hora de fin es menor que la de inicio, cruza la medianoche (ej: 22:00 a 04:00)
  if (endNuevo < startNuevo) {
    endNuevo += 24 * 60;
  }

  for (const b of bloquesExistentes) {
    // Omitir el mismo bloque que se está editando
    if (editId && b.id === editId) continue;
    if (bloqueNuevo.id && b.id === bloqueNuevo.id) continue;

    // Solo evaluar colisiones en el mismo día de la semana
    if (b.dia !== bloqueNuevo.dia) continue;

    const startB = horaAMinutos(b.horaInicio);
    let endB = horaAMinutos(b.horaFin);
    if (endB < startB) {
      endB += 24 * 60;
    }

    // Dos intervalos [s1, e1] y [s2, e2] se cruzan si: s1 < e2 Y e1 > s2
    if (startNuevo < endB && endNuevo > startB) {
      return b; // Hay colisión, retornar el bloque infractor
    }
  }
  return null;
}

/**
 * Determina cuál es la actividad que se está ejecutando en este momento exacto.
 * @param {Array} horario Lista de todas las actividades configuradas
 * @returns {Object} Bloque en curso con el tiempo restante formateado
 */
export function obtenerBloqueActual(horario) {
  if (!horario || !Array.isArray(horario)) {
    return { titulo: 'Tiempo Libre / Planificación 🌟', horaInicio: '--:--', horaFin: '--:--', tiempoRestanteStr: 'Activo' };
  }
  const ahora = new Date();
  const diasInglesEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const diaHoy = diasInglesEsp[ahora.getDay()];
  const minsAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const bloquesHoy = horario.filter(b => b.dia === diaHoy);
  
  for (const b of bloquesHoy) {
    const startMins = horaAMinutos(b.horaInicio);
    let endMins = horaAMinutos(b.horaFin);
    if (endMins < startMins) endMins += 24 * 60; // Caso cruce de medianoche

    let currentMins = minsAhora;
    // Si la actividad cruza la medianoche y estamos en las primeras horas de la madrugada
    if (endMins > 24 * 60 && currentMins < startMins) {
      currentMins += 24 * 60;
    }

    if (currentMins >= startMins && currentMins < endMins) {
      const minsRestantes = endMins - currentMins;
      const tiempoRestanteStr = formatearDuracion(minsRestantes);
      return { ...b, tiempoRestanteStr };
    }
  }

  return { titulo: 'Tiempo Libre / Planificación 🌟', horaInicio: '--:--', horaFin: '--:--', tiempoRestanteStr: 'Activo' };
}

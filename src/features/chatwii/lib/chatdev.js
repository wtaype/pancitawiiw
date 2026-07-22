// src/features/chatwii/lib/chatdev.js
// Recursos reutilizables para potenciar la inteligencia y precisión del asistente

import { saludoSmile } from '@widev';
import { horarioDB } from '../../horario/lib/horario_db.js';
import { obtenerBloqueActual } from '../../horario/lib/horario_dev.js';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Obtiene un bloque de información formateada del tiempo actual en el sistema
 */
export function obtenerContextoTiempoReal() {
  const hoy = new Date();
  const diaHoy = DIAS_SEMANA[hoy.getDay()];
  
  const mañana = new Date();
  mañana.setDate(hoy.getDate() + 1);
  const diaMañana = DIAS_SEMANA[mañana.getDay()];

  const fechaTexto = hoy.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const horaTexto = hoy.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `
INFORMACIÓN DE TIEMPO REAL DEL SISTEMA:
- Fecha de hoy: ${fechaTexto}
- Día de la semana actual: ${diaHoy}
- Hora del sistema: ${horaTexto}
- Día de la semana mañana: ${diaMañana} (Usa esto para responder consultas sobre "mañana")
`.trim();
}

/**
 * Obtiene una lista simplificada de actividades de hoy y mañana
 */
export function obtenerActividadesHoyYManana() {
  try {
    const horario = horarioDB.obtenerHorario() || [];
    const hoy = new Date();
    const diaHoy = DIAS_SEMANA[hoy.getDay()];
    
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);
    const diaMañana = DIAS_SEMANA[mañana.getDay()];

    const filtrarYOrdenar = (dia) => {
      return horario
        .filter(b => b.dia === dia)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        .map(b => `- [${b.horaInicio} a ${b.horaFin}] ${b.titulo} (${b.tipo})`)
        .join('\n') || '  - Ninguna actividad programada.';
    };

    return `
AGENDA INMEDIATA:
* Actividades de Hoy (${diaHoy}):
${filtrarYOrdenar(diaHoy)}
* Actividades de Mañana (${diaMañana}):
${filtrarYOrdenar(diaMañana)}
`.trim();
  } catch (e) {
    console.error('[chatdev] Error al filtrar agenda hoy/mañana:', e);
    return '';
  }
}

/**
 * Genera un saludo dinámico y personalizado cruzando el nombre del perfil con la actividad activa
 */
export function obtenerSaludoInteligente() {
  const baseSaludo = saludoSmile(); // Retorna "Buenos días, Wilder"
  
  try {
    const listaHorario = horarioDB.obtenerHorario();
    const bloqueActual = obtenerBloqueActual(listaHorario);
    if (bloqueActual) {
      return `¡${baseSaludo}! Veo que estás en el horario de ${bloqueActual.titulo.toLowerCase()}. Avísame si hay algo que pueda hacer por ti, amigo.`;
    }
  } catch (e) {
    console.error('[obtenerSaludoInteligente] Error al leer el horario:', e);
  }

  return `¡${baseSaludo}! Avísame si hay algo que pueda hacer por ti, amigo.`;
}

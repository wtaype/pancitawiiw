// src/features/chatwii/skills/leer_horario.js
// Habilidad de Horario para ChatWii: Formateo compacto y eficiente del horario semanal para la IA

import { horarioDB } from '../../horario/lib/horario_db.js';

/**
 * Recupera el horario semanal del usuario y lo formatea de manera
 * compacta para reducir el consumo de tokens y acelerar la respuesta de Gemini.
 */
export function obtenerContextoHorario() {
  try {
    const horario = horarioDB.obtenerHorario();
    if (!horario || horario.length === 0) {
      return 'El usuario no tiene ninguna actividad registrada en su horario semanal.';
    }

    // Agrupar por día para que la IA lo lea de forma lógica
    const agrupado = {};
    horario.forEach(b => {
      if (!agrupado[b.dia]) agrupado[b.dia] = [];
      agrupado[b.dia].push(b);
    });

    // Ordenar actividades por hora de inicio de forma ascendente
    const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let txt = 'HORARIO SEMANAL COMPLETO DEL USUARIO:\n';
    
    diasOrdenados.forEach(dia => {
      if (agrupado[dia] && agrupado[dia].length > 0) {
        txt += `* ${dia}:\n`;
        const bloques = agrupado[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        bloques.forEach(b => {
          txt += `  - [${b.horaInicio} a ${b.horaFin}] "${b.titulo}" (${b.tipo})\n`;
        });
      }
    });

    return txt.trim();
  } catch (err) {
    console.error('Error al formatear contexto horario para IA:', err);
    return 'Error al obtener el horario del usuario.';
  }
}

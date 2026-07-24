// src/features/chatwii/lib/intenciones.js
// Clasificador Unificado de Intenciones para ChatWii
// Clasifica peticiones de música y lectura de contexto de horario actual

export const INTENCIONES = {
  MUSICA_CONTROL: [
    'reproducir cancion', 'pon musica', 'siguiente pista', 'pausar musica',
    'pon lofi', 'siguiente cancion', 'anterior cancion', 'reproducir audio',
    'busca musica', 'play musica', 'sonar', 'que musica esta sonando',
    'sabes que musica', 'cual es esta cancion', 'otra de', 'siguiente de'
  ],
  LECTURA_HORARIO: [
    'que hora es', 'que me toca', 'mi bloque', 'mi horario actual',
    'que tengo que hacer', 'actividad actual'
  ]
};

/**
 * Clasifica la intención del prompt manteniendo la prioridad de música
 * @param {string} promptText - Texto introducido por el usuario
 * @param {Array} attachments - Lista de adjuntos
 * @returns {string} 'MUSICA_CONTROL' | 'LECTURA_HORARIO' | 'GENERAL'
 */
export function clasificarIntencion(promptText = '', attachments = []) {
  const textClean = (promptText || '').toLowerCase().trim();

  // 1. Pedido explícito de música o pregunta sobre la canción sonando
  const esPedidoMusica = INTENCIONES.MUSICA_CONTROL.some(k => textClean.includes(k)) ||
    /musica|música|cancion|canción|reproducir|play|escuchar|playlist|sonar|phonk|lofi|rock|pop|pearl|love|sonando/i.test(textClean);

  if (esPedidoMusica && (!attachments || attachments.length === 0)) {
    return 'MUSICA_CONTROL';
  }

  // 2. Consulta de lectura de horario
  const esConsultaHorario = INTENCIONES.LECTURA_HORARIO.some(k => textClean.includes(k));
  if (esConsultaHorario) {
    return 'LECTURA_HORARIO';
  }

  return 'GENERAL';
}

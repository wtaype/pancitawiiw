// src/features/chatwii/skills/dj_musica.js
// Habilidad de Música para ChatWii: Muestreo inteligente y metadatos de canciones para el asistente de IA

import { obtenerListaPredeterminada } from '../../musica/lista/lista.js';
import { getls } from '@widev';

// Metadatos asociados a las canciones predeterminadas por su ID
const METADATOS_CANCIONES = {
  1: { genero: 'Electrónica / Dance', estilo: 'Slowed & Reverb', temas: ['relajante', 'nostálgico', 'estudiar', 'tranquilo'] },
  2: { genero: 'Phonk', estilo: 'Normal / Hype', temas: ['enérgico', 'motivado', 'ejercicio', 'concentración activa'] },
  3: { genero: 'Pop / R&B', estilo: 'Slowed & Reverb', temas: ['triste', 'emocional', 'desamor', 'melancólico', 'relajarse'] },
  4: { genero: 'Electrónica / Chill', estilo: 'Sped Up / Gamer', temas: ['enérgico', 'alegre', 'gaming', 'rápido'] },
  5: { genero: 'Hip-Hop / R&B', estilo: 'Slowed', temas: ['relajado', 'chillout', 'urbano', 'tranquilo'] },
  6: { genero: 'Indie / Pop', estilo: 'Slowed & Reverb', temas: ['triste', 'melancólico', 'arrepentimiento', 'reflexivo', 'nostálgico'] },
  7: { genero: 'Phonk / Dark Phonk', estilo: 'Super Slowed & Reverb', temas: ['oscuro', 'atmósfera', 'concentración', 'misterioso'] },
  8: { genero: 'Phonk / Sad Phonk', estilo: 'Ultra Slowed & Reverb', temas: ['triste', 'melancólico', 'nocturno', 'nostálgico', 'relajante'] }
};

/**
 * Obtiene la playlist cargada en el reproductor (predeterminada o personalizada del usuario)
 * y la enriquece con metadatos de búsqueda si corresponden a los temas por defecto.
 */
export function obtenerPlaylistConMetadatos() {
  let playlist = obtenerListaPredeterminada();
  try {
    const carpetasGuardadas = getls('musica_carpetas');
    if (carpetasGuardadas && carpetasGuardadas.length > 0) {
      const activa = carpetasGuardadas.find(c => c.activa) || carpetasGuardadas[0];
      if (activa && activa.canciones && activa.canciones.length > 0) {
        playlist = activa.canciones;
      }
    }
  } catch (e) {
    console.error('Error al cargar playlist para IA:', e);
  }

  return playlist.map(cancion => {
    const meta = METADATOS_CANCIONES[cancion.id];
    if (meta) {
      return {
        id: cancion.id,
        titulo: cancion.titulo,
        genero: meta.genero,
        estilo: meta.estilo,
        temas: meta.temas
      };
    }
    // Para canciones personalizadas de carpetas del usuario (sin metadatos predefinidos)
    return {
      id: cancion.id,
      titulo: cancion.titulo,
      genero: 'Personalizada',
      estilo: 'Local',
      temas: ['archivo local', 'usuario']
    };
  });
}

/**
 * Retorna la lista en un formato de texto compacto y resumido.
 * Si la lista tiene más de 20 canciones, solo envía las primeras 15 y añade una nota explicativa
 * para que Gemini busque el resto semánticamente o por coincidencia de texto.
 */
export function obtenerContextoPlaylistParaIA() {
  const playlist = obtenerPlaylistConMetadatos();
  if (playlist.length === 0) {
    return 'La playlist del reproductor está vacía.';
  }

  let totalCanciones = playlist.length;
  let cancionesAEnviar = playlist;
  let esTruncada = false;

  if (totalCanciones > 20) {
    cancionesAEnviar = playlist.slice(0, 15);
    esTruncada = true;
  }

  let txt = `PLAYLIST DE MÚSICA CARGADA EN EL REPRODUCTOR (Total: ${totalCanciones} canciones):\n`;
  cancionesAEnviar.forEach(c => {
    txt += `- ID ${c.id}: "${c.titulo}" [Género: ${c.genero}, Estilo: ${c.estilo}, Tags: ${c.temas.join(', ')}]\n`;
  });

  if (esTruncada) {
    txt += `... y hay ${totalCanciones - 15} canciones más cargadas en la carpeta de música del usuario.\n`;
    txt += `NOTA IMPORTANTE PARA TI (IA): Si el usuario te pide una canción que no está listada arriba (ej: una de sus 300+ canciones locales), puedes generar el comando [MUSIC:PLAY:Nombre de la canción o palabra clave] o [MUSIC:SEARCH:término] e intentar reproducirla. El reproductor buscará la coincidencia en todo su almacenamiento en caliente.\n`;
  }

  return txt.trim();
}

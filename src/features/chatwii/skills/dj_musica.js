// src/features/chatwii/skills/dj_musica.js
// Habilidad de Música Inteligente para ChatWii: Buscador Fuzzy / Memoria de Rotación / Pista Activa en Tiempo Real

import { obtenerListaPredeterminada } from '../../musica/lista/lista.js';
import { getls } from '@widev';

// Memoria interna de rotación para consultas consecutivas ("otra de love", "siguiente de pearl")
let memoriaRotacion = {
  termino: '',
  coincidencias: [],
  indiceActual: 0
};

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

function normalizarTexto(txt = '') {
  return String(txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function obtenerPlaylistCompleta() {
  let playlist = obtenerListaPredeterminada();
  try {
    const carpetasGuardadas = getls('musica_carpetas') || [];
    const config = getls('musica_config') || {};
    const combinarTodas = config.combinarTodas || false;

    if (carpetasGuardadas.length > 0) {
      if (combinarTodas) {
        let mergedSongs = [];
        carpetasGuardadas.forEach(folder => {
          if (folder.canciones) {
            folder.canciones.forEach(c => {
              const yaExiste = mergedSongs.some(m => m.archivo === c.archivo || m.url === c.url || (c.ruta_completa && m.ruta_completa === c.ruta_completa));
              if (!yaExiste) {
                mergedSongs.push({ ...c });
              }
            });
          }
        });
        playlist = mergedSongs.map((c, idx) => ({ ...c, id: idx + 1 }));
      } else {
        const activa = carpetasGuardadas.find(c => c.activa) || carpetasGuardadas[0];
        if (activa && activa.canciones && activa.canciones.length > 0) {
          playlist = activa.canciones;
        }
      }
    }
  } catch (e) {
    console.error('Error al cargar playlist para IA:', e);
  }

  return playlist.map(cancion => {
    const meta = METADATOS_CANCIONES[cancion.id];
    return {
      id: cancion.id,
      titulo: cancion.titulo || cancion.nombre || 'Sin título',
      genero: meta?.genero || 'Personalizada',
      estilo: meta?.estilo || 'Local',
      temas: meta?.temas || ['archivo local']
    };
  });
}

/**
 * Obtiene la información exacta de la canción que suena actualmente en el reproductor
 */
export function obtenerPistaActivaInfo() {
  if (typeof window !== 'undefined' && window.wiMusica?.getTrackActual) {
    try {
      return window.wiMusica.getTrackActual();
    } catch (_) {}
  }
  const playlist = obtenerPlaylistCompleta();
  const primera = playlist[0] || { id: 1, titulo: 'Desconocida' };
  return { id: primera.id, titulo: primera.titulo, sonando: false };
}

/**
 * Buscador Fuzzy con Memoria de Rotación sobre 500+ canciones
 * Soporta "otra de love", "siguiente de pearl", palabras clave e iniciales
 */
export function buscarCoincidenciasMusica(query = '') {
  const qNorm = normalizarTexto(query);
  if (!qNorm) return [];

  const playlist = obtenerPlaylistCompleta();
  const palabrasBusqueda = qNorm.split(/\s+/).filter(w => w.length > 0 && !['otra', 'siguiente', 'cambia', 'pon', 'de', 'musica', 'cancion'].includes(w));
  const busquedaBase = palabrasBusqueda.join(' ') || qNorm;

  const esPeticionSiguiente = /otra|siguiente|cambia|mas/i.test(query);

  // Si el usuario pide "otra de X" y el término coincide con la búsqueda anterior, rotar al siguiente resultado
  if (esPeticionSiguiente && memoriaRotacion.termino && (busquedaBase.includes(memoriaRotacion.termino) || memoriaRotacion.termino.includes(busquedaBase))) {
    if (memoriaRotacion.coincidencias.length > 0) {
      memoriaRotacion.indiceActual = (memoriaRotacion.indiceActual + 1) % memoriaRotacion.coincidencias.length;
      return memoriaRotacion.coincidencias;
    }
  }

  // Realizar nueva búsqueda Fuzzy sobre las 500+ canciones
  const coincidencias = playlist.map(cancion => {
    const tNorm = normalizarTexto(cancion.titulo);
    let puntaje = 0;

    if (tNorm.startsWith(busquedaBase)) puntaje += 100;
    else if (tNorm.includes(busquedaBase)) puntaje += 80;

    palabrasBusqueda.forEach(palabra => {
      if (tNorm.includes(palabra)) puntaje += 30;
    });

    const iniciales = tNorm.split(/\s+/).map(w => w[0]).join('');
    if (iniciales.startsWith(busquedaBase)) puntaje += 40;

    return { ...cancion, puntaje };
  })
  .filter(item => item.puntaje > 0)
  .sort((a, b) => b.puntaje - a.puntaje)
  .slice(0, 10);

  // Guardar en memoria de rotación
  memoriaRotacion = {
    termino: busquedaBase,
    coincidencias: coincidencias,
    indiceActual: 0
  };

  return coincidencias;
}

/**
 * Retorna el contexto musical en tiempo real para Gemini
 */
export function obtenerContextoPlaylistParaIA(textoUsuario = '') {
  const playlist = obtenerPlaylistCompleta();
  const pistaActiva = obtenerPistaActivaInfo();

  let txt = `REPRODUCTOR DE MÚSICA EN TIEMPO REAL:\n`;
  txt += `- PISTA REPRODUCIÉNDOSE AHORA: "${pistaActiva.titulo}" (ID ${pistaActiva.id}, Estado: ${pistaActiva.sonando ? 'Reproduciendo 🎵' : 'Pausado ⏸️'})\n`;
  txt += `- Total de canciones en biblioteca: ${playlist.length} canciones cargadas.\n\n`;

  // Limpiar texto para extraer palabras clave de búsqueda
  const textoLimpio = textoUsuario.replace(/musica|música|cancion|canción|reproducir|play|escuchar|sonar|pone|pon|gracias|amigo/gi, '').trim();

  let coincidencias = [];
  if (textoLimpio.length >= 2) {
    coincidencias = buscarCoincidenciasMusica(textoUsuario);
  }

  if (coincidencias.length > 0) {
    const idxSeleccionado = memoriaRotacion.indiceActual % coincidencias.length;
    const cancionElegida = coincidencias[idxSeleccionado];

    txt += `🎯 COINCIDENCIAS DE TU BÚSQUEDA EN LA BIBLIOTECA (${coincidencias.length} encontradas):\n`;
    coincidencias.slice(0, 5).forEach((c, idx) => {
      txt += `  ${idx === idxSeleccionado ? '👉 [SELECCIONADA ACTUALMENTE]' : '  '} ID ${c.id}: "${c.titulo}" [Género: ${c.genero}]\n`;
    });

    txt += `\nINSTRUCCIÓN PARA TI (IA):
Responde amigablemente anunciando las primeras 2-3 palabras del título de la canción seleccionada ("${cancionElegida.titulo.split(' ').slice(0, 3).join(' ')}") y emite OBLIGATORIAMENTE el comando [MUSIC:PLAY:${cancionElegida.id}].\n`;
  } else if (/sonando|reproduciendo|cual es|que musica|que cancion/i.test(textoUsuario)) {
    txt += `INSTRUCCIÓN PARA TI (IA): El usuario está preguntando por la canción que suena en este momento. Dile claramente que está sonando "${pistaActiva.titulo}".\n`;
  } else {
    txt += `Si el usuario te pide una canción por nombre o iniciales no listada, puedes generar [MUSIC:PLAY:TérminoOId] y el reproductor la buscará en tiempo real.\n`;
  }

  return txt.trim();
}

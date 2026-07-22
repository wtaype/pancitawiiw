// src/features/chatwii/services/musica.js - Controlador de música en segundo plano (Onewii-Style)
import { getls } from '@widev';

let _audio = new Audio();
let _playlist = [];
let _indexActual = -1;
let _loop = false;
let _carpeta = '';

// Al finalizar una canción, reproducir la siguiente automáticamente
_audio.addEventListener('ended', () => {
  if (_loop) {
    _audio.currentTime = 0;
    _audio.play().catch(err => console.error("Error al repetir canción:", err));
  } else {
    siguiente();
  }
});

/**
 * Carga la configuración de la carpeta de música y realiza el escaneo inicial
 */
export async function cargarCarpetaYMusica() {
  if (!window.__TAURI__) return [];
  
  try {
    const carpetaGuardada = await window.__TAURI__.core.invoke('obtener_carpeta_musica');
    if (carpetaGuardada) {
      _carpeta = carpetaGuardada;
      const canciones = await window.__TAURI__.core.invoke('escanear_musica_local', { ruta: _carpeta });
      _playlist = canciones || [];
      return _playlist;
    }
  } catch (e) {
    console.error("Error al cargar música local:", e);
  }
  return [];
}

export const obtenerPlaylist = () => _playlist;
export const obtenerCarpetaConfigurada = () => _carpeta;
export const obtenerCancionActual = () => _indexActual >= 0 && _indexActual < _playlist.length ? _playlist[_indexActual] : null;
export const estaReproduciendo = () => !_audio.paused && _audio.currentTime > 0;
export const esLoopActivo = () => _loop;

export function reproducirIndice(index) {
  if (index < 0 || index >= _playlist.length) return "Índice fuera de rango";
  
  _indexActual = index;
  const cancion = _playlist[_indexActual];
  
  if (window.__TAURI__) {
    // Convertir ruta absoluta a URL de protocolo de recursos de Tauri
    const assetUrl = window.__TAURI__.core.convertFileSrc(cancion.ruta);
    _audio.src = assetUrl;
    _audio.play()
      .then(() => {
        if (window.Mensaje) {
          window.Mensaje(`🎵 Reproduciendo: ${cancion.nombre}`, 'info');
        }
      })
      .catch(err => {
        console.error("Error al reproducir audio:", err);
        if (window.Mensaje) {
          window.Mensaje(`Error al reproducir audio: ${cancion.nombre}`, 'error');
        }
      });
    return `Reproduciendo cancion: ${cancion.nombre}`;
  }
  return "Tauri no disponible";
}

export function reproducir() {
  if (_playlist.length === 0) return "No hay canciones en la playlist";
  if (_indexActual === -1) {
    return reproducirIndice(0);
  }
  _audio.play().catch(e => console.error("Error al reanudar:", e));
  return "Música reanudada";
}

export function pausar() {
  _audio.pause();
  if (window.Mensaje) {
    window.Mensaje("🎵 Música pausada", 'info');
  }
  return "Música pausada";
}

export function siguiente() {
  if (_playlist.length === 0) return "No hay canciones";
  const sigIdx = (_indexActual + 1) % _playlist.length;
  return reproducirIndice(sigIdx);
}

export function anterior() {
  if (_playlist.length === 0) return "No hay canciones";
  const antIdx = _indexActual <= 0 ? _playlist.length - 1 : _indexActual - 1;
  return reproducirIndice(antIdx);
}

export function toggleLoop() {
  _loop = !_loop;
  if (window.Mensaje) {
    window.Mensaje(_loop ? "🎵 Repetición activada" : "🎵 Repetición desactivada", 'info');
  }
  return _loop ? "Bucle activado" : "Bucle desactivado";
}

/**
 * Busca y reproduce una canción basada en el estado de ánimo (búsqueda inteligente por nombre)
 */
export function reproducirPorEstadoAnimo(estado) {
  if (_playlist.length === 0) return "No hay canciones cargadas";
  
  const estMinuscula = estado.toLowerCase();
  let coincidencias = [];

  // Mapeos de palabras clave de estado de ánimo a tags en el nombre del archivo
  let keywords = [];
  if (estMinuscula.includes('triste') || estMinuscula.includes('melancolico') || estMinuscula.includes('llorar')) {
    keywords = ['triste', 'sad', 'piano', 'suave', 'soft', 'slow', 'relax', 'chill'];
  } else if (estMinuscula.includes('alegre') || estMinuscula.includes('feliz') || estMinuscula.includes('motivar') || estMinuscula.includes('energia')) {
    keywords = ['alegre', 'happy', 'dance', 'pop', 'upbeat', 'rock', 'energy', 'motiva'];
  } else if (estMinuscula.includes('estudiar') || estMinuscula.includes('trabajar') || estMinuscula.includes('concentrar')) {
    keywords = ['chill', 'relax', 'study', 'focus', 'lofi', 'instrumental', 'piano'];
  }

  // Filtrar canciones que contengan alguna keyword
  for (const keyword of keywords) {
    const filtrado = _playlist.filter(c => c.nombre.toLowerCase().includes(keyword));
    coincidencias = [...coincidencias, ...filtrado];
  }

  // Quitar duplicados
  coincidencias = [...new Set(coincidencias)];

  if (coincidencias.length > 0) {
    // Escoger una aleatoria de las coincidencias
    const randIdx = Math.floor(Math.random() * coincidencias.length);
    const seleccionada = coincidencias[randIdx];
    const realIdx = _playlist.findIndex(c => c.ruta === seleccionada.ruta);
    return reproducirIndice(realIdx);
  } else {
    // Si no coincide ninguna keyword, escoger una canción al azar de toda la playlist
    const randIdx = Math.floor(Math.random() * _playlist.length);
    return reproducirIndice(randIdx);
  }
}

/**
 * Busca una canción específica por coincidencia de nombre
 */
export function reproducirCancionPorNombre(busqueda) {
  if (_playlist.length === 0) return "No hay canciones cargadas";
  
  const term = busqueda.toLowerCase();
  const idx = _playlist.findIndex(c => c.nombre.toLowerCase().includes(term));
  
  if (idx !== -1) {
    return reproducirIndice(idx);
  } else {
    // Si no la encuentra, reproducir al azar
    const randIdx = Math.floor(Math.random() * _playlist.length);
    return reproducirIndice(randIdx);
  }
}

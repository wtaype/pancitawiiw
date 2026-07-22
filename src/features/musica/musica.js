// src/features/musica/musica.js
// Motor Principal de Reproducción de Audio — Orquestador Modular con Persistencia Total de Likes ('musica_likes')

import { obtenerListaPredeterminada } from '@features/musica/lista/lista.js';
import { savels, getls } from '@core/widev/storage.js';
import { wiTip } from '@core/widev/witip.js';
import { wiAtajo } from '@core/widev/atajos.js';
import { renderHero, bindHeroEvents } from '@features/musica/componentes/hero.js';
import { renderFiltros, bindFiltrosEvents } from '@features/musica/componentes/filtros.js';
import { renderListaItems, bindListaItemsEvents } from '@features/musica/componentes/lista_items.js';
import { abrirModalMusica, renderMisCarpetasHTML } from '@features/musica/componentes/modal_rutas.js';
import '@features/musica/musica.css';

const DEFAULT_PLAYLIST = obtenerListaPredeterminada();
const STORAGE_KEY_LISTA = 'musica_lista';
const STORAGE_KEY_CARPETAS = 'musica_carpetas';
const STORAGE_KEY_LIKES = 'musica_likes';
const TAMANO_PAGINA = 10;

const DEFAULT_CARPETAS = [
  {
    id: 'default',
    nombre: 'src\\features\\musica\\lista',
    canciones: DEFAULT_PLAYLIST,
    fecha: '21 jul 2026',
    activa: true
  }
];

// Helper para convertir ruta local a URL de activo segura (Tauri asset protocol)
export function resolverUrlPista(pista) {
  if (!pista) return '';
  const ruta = pista.ruta_completa || pista.url;

  if (typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)) {
    try {
      const convertFileSrc = window.__TAURI__.core?.convertFileSrc || window.__TAURI__.tauri?.convertFileSrc;
      if (convertFileSrc && pista.ruta_completa) {
        return convertFileSrc(pista.ruta_completa);
      }
    } catch (e) {
      console.warn('convertFileSrc error:', e);
    }
  }

  // Fallback para web o recursos estáticos
  if (pista.url && !pista.url.startsWith('blob:')) return pista.url;
  const match = DEFAULT_PLAYLIST.find(d => d.id === pista.id || d.titulo === pista.titulo);
  return match?.url || DEFAULT_PLAYLIST[0]?.url || '';
}

const STORAGE_KEY_CONFIG = 'musica_config';

// ── Carga y Persistencia de Estado ───────────────────────────────────────────
function cargarEstado() {
  const carpetasGuardadas = getls(STORAGE_KEY_CARPETAS) || DEFAULT_CARPETAS;
  const listaGuardada = getls(STORAGE_KEY_LISTA);
  const likesGuardados = getls(STORAGE_KEY_LIKES) || [];
  const configGuardada = getls(STORAGE_KEY_CONFIG) || {
    volume: 1.0,
    isMuted: false,
    repeatMode: 'off',
    shuffleActive: false,
    combinarRutas: true
  };

  let carpetaActiva = carpetasGuardadas.find(c => c.activa) || carpetasGuardadas[0];
  const listRaw = carpetaActiva?.canciones || DEFAULT_PLAYLIST;

  return {
    carpetas:   carpetasGuardadas,
    playlist:   listRaw,
    trackIndex: listaGuardada?.trackIndex ?? 0,
    likes:      Array.isArray(likesGuardados) ? likesGuardados : [],
    filtro:     'todos',
    carpetaId:  carpetaActiva.id,
    carpetaNom: carpetaActiva.nombre,
    config:     configGuardada
  };
}

function guardarEstado() {
  savels(STORAGE_KEY_CARPETAS, carpetasGuardadas, 8760);
  savels(STORAGE_KEY_LIKES, likes, 8760);
  savels(STORAGE_KEY_CONFIG, {
    volume,
    isMuted,
    repeatMode,
    shuffleActive,
    combinarRutas
  }, 8760);
  savels(STORAGE_KEY_LISTA, {
    playlist:   playlistActual,
    trackIndex: currentTrackIndex,
    carpetaId:  carpetaActivaId,
    carpetaNom: carpetaActual
  }, 8760);
}

// ── Estado Global ─────────────────────────────────────────────────────────────
const estado = cargarEstado();
let carpetasGuardadas = estado.carpetas;
let playlistActual    = estado.playlist;
let currentTrackIndex = estado.trackIndex;
let likes             = estado.likes;
let filtroActivo      = estado.filtro;
let carpetaActivaId   = estado.carpetaId;
let carpetaActual     = estado.carpetaNom;
let paginaActual      = 1;
let searchQuery       = '';
let sortOrder         = 'id';
let isPlaying         = false;

// Estado de volumen, mute, repeat y shuffle
let volume            = estado.config?.volume ?? 1.0;
let isMuted           = estado.config?.isMuted ?? false;
let repeatMode        = estado.config?.repeatMode ?? 'off';
let shuffleActive     = estado.config?.shuffleActive ?? false;
let combinarRutas     = estado.config?.combinarRutas ?? true;

const audio = new Audio();
audio.volume = isMuted ? 0 : volume;

function aplicarVolumen() {
  audio.volume = isMuted ? 0 : volume;
}

let atajosLimpieza = [];
function limpiarAtajos() {
  atajosLimpieza.forEach(fn => {
    if (typeof fn === 'function') fn();
  });
  atajosLimpieza = [];
}

function obtenerSiguienteIndex(avanzar = true) {
  if (playlistActual.length === 0) return 0;
  if (repeatMode === 'one' && avanzar) return currentTrackIndex;
  if (shuffleActive) {
    if (playlistActual.length <= 1) return 0;
    let nextIdx;
    let attempts = 0;
    do {
      nextIdx = Math.floor(Math.random() * playlistActual.length);
      attempts++;
    } while (nextIdx === currentTrackIndex && attempts < 10);
    return nextIdx;
  }
  let nextIdx = avanzar ? currentTrackIndex + 1 : currentTrackIndex - 1;
  return nextIdx;
}

function tienelike(pistaOrId) {
  if (!pistaOrId) return false;
  const key = typeof pistaOrId === 'object' ? pistaOrId.titulo : pistaOrId;
  return likes.includes(key) || likes.includes(pistaOrId.id);
}

function toggleLike(pistaOrId) {
  const track = typeof pistaOrId === 'object'
    ? pistaOrId
    : playlistActual.find(p => p.id === pistaOrId || p.titulo === pistaOrId);

  if (!track) return;
  const key = track.titulo;

  if (likes.includes(key)) {
    likes = likes.filter(l => l !== key && l !== track.id);
  } else {
    likes.push(key);
  }

  savels(STORAGE_KEY_LIKES, likes, 8760);
  guardarEstado();
}

function playlistFiltrada() {
  let lista = playlistActual;
  if (filtroActivo === 'favoritos') lista = lista.filter(t => tienelike(t));
  if (searchQuery) lista = lista.filter(t => t.titulo.toLowerCase().includes(searchQuery.toLowerCase()));
  if (sortOrder === 'az') lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo));
  return lista;
}

// ── Render Principal ─────────────────────────────────────────────────────────
export function renderMusica() {
  const actual = playlistActual[currentTrackIndex] || playlistActual[0] || { titulo: 'Sin canción', peso: '0 MB', fecha: '-' };
  const filtradas = playlistFiltrada();
  const totalPaginas = Math.ceil(filtradas.length / TAMANO_PAGINA) || 1;

  return `
    <div class="musica_panel_card">
      ${renderHero(actual, isPlaying, tienelike(actual), carpetaActual)}
      ${renderFiltros(filtroActivo, playlistActual.length, likes.length, paginaActual, totalPaginas)}
      <div class="msc_track_list_scroll" id="msc_track_list">
        ${renderListaItems(filtradas, paginaActual, TAMANO_PAGINA, playlistActual, actual.id, tienelike, isPlaying)}
      </div>
    </div>
  `;
}

// ── Eventos y Vincular DOM ────────────────────────────────────────────────────
export function bindMusicaEvents(container) {
  wiTip();

  const trackListContainer = container.querySelector('#msc_track_list');

  limpiarAtajos();
  const atajos = [
    wiAtajo('arrowright', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      cargarYReproducir(obtenerSiguienteIndex(true), true);
    }),
    wiAtajo('arrowleft', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      cargarYReproducir(obtenerSiguienteIndex(false), true);
    }),
    wiAtajo(' ', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      togglePlayPause();
    }),
    wiAtajo('arrowup', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      volume = Math.min(volume + 0.1, 1.0);
      if (volume > 0) isMuted = false;
      aplicarVolumen();
      guardarEstado();
      refrescarUICompleta();
    }),
    wiAtajo('arrowdown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      volume = Math.max(volume - 0.1, 0.0);
      if (volume === 0) isMuted = true;
      aplicarVolumen();
      guardarEstado();
      refrescarUICompleta();
    })
  ];
  atajosLimpieza.push(...atajos);

  function refrescarUICompleta() {
    const actual = playlistActual[currentTrackIndex] || playlistActual[0];
    const likedActual = tienelike(actual);

    // 1. Refrescar Botón Favoritos del Hero Player
    const favBtn = container.querySelector('#msc_btn_fav');
    if (favBtn) {
      favBtn.className = `msc_ctrl_btn ${likedActual ? 'liked' : ''}`;
      favBtn.setAttribute('data-witip', likedActual ? 'Quitar favorito' : 'Agregar a favoritos');
      favBtn.innerHTML = `<i class="fa-${likedActual ? 'solid' : 'regular'} fa-heart"></i>`;
    }

    // 1.1 Refrescar Botón de Shuffle
    const shuffleBtn = container.querySelector('#msc_btn_shuffle');
    if (shuffleBtn) {
      shuffleBtn.className = `msc_ctrl_btn ${shuffleActive ? 'active' : ''}`;
      shuffleBtn.setAttribute('data-witip', shuffleActive ? 'Desactivar modo aleatorio' : 'Activar modo aleatorio');
    }

    // 1.2 Refrescar Botón de Repeat
    const repeatBtn = container.querySelector('#msc_btn_repeat');
    if (repeatBtn) {
      let iconClass = 'fa-repeat';
      let tooltip = 'Activar repetición';
      if (repeatMode === 'all') {
        repeatBtn.className = 'msc_ctrl_btn active';
        tooltip = 'Repetir lista completa';
      } else if (repeatMode === 'one') {
        repeatBtn.className = 'msc_ctrl_btn active';
        iconClass = 'fa-arrows-spin';
        tooltip = 'Repetir canción actual';
      } else {
        repeatBtn.className = 'msc_ctrl_btn';
        tooltip = 'Repetir: Apagado';
      }
      repeatBtn.setAttribute('data-witip', tooltip);
      const repeatIcon = repeatBtn.querySelector('i');
      if (repeatIcon) {
        repeatIcon.className = `fa-solid ${iconClass}`;
      }
    }

    // 1.3 Refrescar Volumen y Mute en la UI
    const volumeSlider = container.querySelector('#msc_volume_slider');
    if (volumeSlider) {
      volumeSlider.value = isMuted ? 0 : volume;
    }
    const volumeBtn = container.querySelector('#msc_btn_volume');
    if (volumeBtn) {
      volumeBtn.className = `msc_vol_btn ${isMuted ? 'muted' : ''}`;
      volumeBtn.setAttribute('data-witip', isMuted ? 'Activar sonido' : 'Silenciar');
      volumeBtn.innerHTML = `<i class="fa-solid ${isMuted || volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'}"></i>`;
    }

    // 1.4 Refrescar Botón Principal de Reproducción (Play/Pause)
    const mainPlayBtn = container.querySelector('#msc_main_play_btn');
    if (mainPlayBtn) {
      mainPlayBtn.setAttribute('data-witip', isPlaying ? 'Pausar' : 'Reproducir');
      mainPlayBtn.innerHTML = `<i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>`;
    }

    // 1.5 Refrescar visualizadores de ondas laterales
    const vizLeft = container.querySelector('#msc_visualizer_left');
    const vizRight = container.querySelector('#msc_visualizer_right');
    [vizLeft, vizRight].forEach(el => {
      if (el) {
        if (isPlaying) el.classList.add('playing');
        else el.classList.remove('playing');
      }
    });

    // 2. Refrescar Pestaña de Favoritos (xx)
    const favTab = container.querySelector('[data-filter="favoritos"]');
    if (favTab) {
      favTab.innerHTML = `<i class="fa-solid fa-heart"></i> Favoritos (${likes.length})`;
    }

    // 2.1 Refrescar Pestaña de Todos (xx)
    const todosTab = container.querySelector('[data-filter="todos"]');
    if (todosTab) {
      todosTab.innerHTML = `<i class="fa-solid fa-music"></i> Todos (${playlistActual.length})`;
    }

    // 3. Refrescar Lista de Canciones
    const filtradas = playlistFiltrada();
    const totalPaginas = Math.ceil(filtradas.length / TAMANO_PAGINA) || 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    if (trackListContainer) {
      trackListContainer.innerHTML = renderListaItems(filtradas, paginaActual, TAMANO_PAGINA, playlistActual, actual?.id, tienelike, isPlaying);
      bindListaItemsEvents(container, {
        onTrackSelect: (idx) => {
          if (idx === currentTrackIndex) togglePlayPause();
          else cargarYReproducir(idx, true);
        },
        onPlayMini: (idx) => {
          if (idx === currentTrackIndex) togglePlayPause();
          else cargarYReproducir(idx, true);
        },
        onToggleFavMini: (trackId) => {
          const track = playlistActual.find(p => p.id === trackId);
          if (track) {
            toggleLike(track);
            refrescarUICompleta();
          }
        }
      });
    }

    const btnPrevTop = container.querySelector('#msc_btn_page_prev_top');
    const btnNextTop = container.querySelector('#msc_btn_page_next_top');
    if (btnPrevTop) btnPrevTop.disabled = paginaActual <= 1;
    if (btnNextTop) btnNextTop.disabled = paginaActual >= totalPaginas;
  }

  function cargarYReproducir(index, autoPlay = true) {
    if (index < 0) index = playlistActual.length - 1;
    if (index >= playlistActual.length) index = 0;
    currentTrackIndex = index;

    const track = playlistActual[currentTrackIndex] || playlistActual[0];
    if (track) {
      const srcSeguro = resolverUrlPista(track);
      if (audio.src !== srcSeguro) audio.src = srcSeguro;
    }

    aplicarVolumen();
    guardarEstado();

    const titleNowEl = container.querySelector('#msc_now_title');
    const metaTextEl = container.querySelector('#msc_meta_text');

    if (titleNowEl && track) titleNowEl.textContent = track.titulo;
    if (metaTextEl && track) metaTextEl.textContent = `MP3 · ${track.peso} · Modificado: ${track.fecha}`;

    if (autoPlay && track) {
      audio.play().then(() => {
        isPlaying = true;
        refrescarUICompleta();
      }).catch(err => {
        console.warn('AutoPlay:', err);
        isPlaying = false;
        refrescarUICompleta();
      });
    } else {
      isPlaying = false;
      refrescarUICompleta();
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      refrescarUICompleta();
    } else {
      const track = playlistActual[currentTrackIndex];
      const srcSeguro = resolverUrlPista(track);
      if (!audio.src || audio.src !== srcSeguro) {
        cargarYReproducir(currentTrackIndex, true);
        return;
      }
      aplicarVolumen();
      audio.play().then(() => {
        isPlaying = true;
        refrescarUICompleta();
      }).catch(err => {
        console.warn('Play error:', err);
        isPlaying = false;
        refrescarUICompleta();
      });
    }
  }

  function activarCarpetaPorId(folderId) {
    const carpeta = carpetasGuardadas.find(c => c.id === folderId);
    if (!carpeta) return;

    carpetasGuardadas.forEach(c => c.activa = (c.id === folderId));
    carpetaActivaId = folderId;
    carpetaActual = carpeta.nombre;
    playlistActual = carpeta.canciones || DEFAULT_PLAYLIST;
    currentTrackIndex = 0;
    paginaActual = 1;

    guardarEstado();
    cargarYReproducir(0, true);
    refrescarUICompleta();
  }

  function eliminarCarpetaPorId(folderId) {
    if (carpetasGuardadas.length <= 1) {
      alert('Debes mantener al menos una carpeta en la lista.');
      return;
    }

    carpetasGuardadas = carpetasGuardadas.filter(c => c.id !== folderId);

    if (carpetaActivaId === folderId) {
      activarCarpetaPorId(carpetasGuardadas[0].id);
    } else {
      guardarEstado();
    }

    const foldersList = document.querySelector('#msc_folders_list');
    const badgeCount = document.querySelector('#msc_badge_folders');
    if (foldersList) foldersList.innerHTML = renderMisCarpetasHTML(carpetasGuardadas, carpetaActivaId);
    if (badgeCount) badgeCount.textContent = carpetasGuardadas.length;
  }

  // Bind Hero Player
  bindHeroEvents(container, {
    onTogglePlay: togglePlayPause,
    onPrev: () => cargarYReproducir(obtenerSiguienteIndex(false), true),
    onNext: () => cargarYReproducir(obtenerSiguienteIndex(true), true),
    onToggleFav: () => {
      const track = playlistActual[currentTrackIndex];
      if (track) {
        toggleLike(track);
        refrescarUICompleta();
      }
    },
    onSeek: (pct) => {
      if (audio.duration) audio.currentTime = pct * audio.duration;
    },
    onToggleShuffle: () => {
      shuffleActive = !shuffleActive;
      guardarEstado();
      refrescarUICompleta();
    },
    onToggleRepeat: () => {
      if (repeatMode === 'off') {
        repeatMode = 'all';
      } else if (repeatMode === 'all') {
        repeatMode = 'one';
      } else {
        repeatMode = 'off';
      }
      guardarEstado();
      refrescarUICompleta();
    },
    onVolumeChange: (val) => {
      volume = val;
      if (volume > 0) isMuted = false;
      aplicarVolumen();
      guardarEstado();
      refrescarUICompleta();
    },
    onToggleMute: () => {
      isMuted = !isMuted;
      aplicarVolumen();
      guardarEstado();
      refrescarUICompleta();
    },
    onCopyPath: (btn) => {
      const track = playlistActual[currentTrackIndex] || playlistActual[0];
      if (track) {
        const pathACopiar = track.ruta_completa || track.url || '';
        if (pathACopiar) {
          navigator.clipboard.writeText(pathACopiar).then(() => {
            wiTip(btn, 'Ruta copiada al portapapeles', 'top', 1500);
          }).catch(err => {
            console.error('Copy error:', err);
            wiTip(btn, 'Error al copiar ruta', 'top', 1500);
          });
        }
      }
    }
  });

  // Bind Filtros & Acciones
  bindFiltrosEvents(container, {
    onFilterChange: (filtro) => { filtroActivo = filtro; paginaActual = 1; refrescarUICompleta(); },
    onSearch: (q) => { searchQuery = q; paginaActual = 1; refrescarUICompleta(); },
    onSort: (order) => { sortOrder = order; paginaActual = 1; refrescarUICompleta(); },
    onPrevPage: () => { if (paginaActual > 1) { paginaActual--; refrescarUICompleta(); } },
    onNextPage: () => {
      const totalPaginas = Math.ceil(playlistFiltrada().length / TAMANO_PAGINA) || 1;
      if (paginaActual < totalPaginas) { paginaActual++; refrescarUICompleta(); }
    },
    onRefresh: (btn) => { refrescarUICompleta(); wiTip(btn, 'Lista actualizada', 'top', 1500); },
    onAdd: () => {
      abrirModalMusica(carpetasGuardadas, carpetaActivaId, combinarRutas, {
        onSeleccionarNuevaCarpeta: (nuevasCanciones, nombreCarpeta, rutaRaiz) => {
          if (combinarRutas) {
            const activa = carpetasGuardadas.find(c => c.activa) || carpetasGuardadas[0];
            if (activa) {
              let startId = activa.canciones.reduce((max, c) => Math.max(max, c.id), 0) + 1;
              const cancionesMapeadas = nuevasCanciones.map((cancion, idx) => ({
                ...cancion,
                id: startId + idx
              }));
              activa.canciones = [...activa.canciones, ...cancionesMapeadas];
              playlistActual = activa.canciones;
              guardarEstado();
              refrescarUICompleta();
              return;
            }
          }

          const nuevaCarpeta = {
            id: 'folder_' + Date.now(),
            nombre: rutaRaiz || nombreCarpeta,
            canciones: nuevasCanciones,
            fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
            activa: true
          };

          carpetasGuardadas.forEach(c => c.activa = false);
          carpetasGuardadas.unshift(nuevaCarpeta);
          activarCarpetaPorId(nuevaCarpeta.id);
        },
        onActivarCarpeta: (folderId) => activarCarpetaPorId(folderId),
        onEliminarCarpeta: (folderId) => eliminarCarpetaPorId(folderId),
        onToggleCombine: (checked) => {
          combinarRutas = checked;
          guardarEstado();
        }
      });
    }
  });

  // Listener Audio Progress
  audio.onloadedmetadata = () => {
    const total = container.querySelector('#msc_time_total');
    if (total && audio.duration) {
      total.textContent = `${Math.floor(audio.duration / 60)}:${String(Math.floor(audio.duration % 60)).padStart(2, '0')}`;
    }
  };

  audio.ontimeupdate = () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    const fill = container.querySelector('#msc_progress_fill');
    const curr = container.querySelector('#msc_time_curr');
    const total = container.querySelector('#msc_time_total');
    if (fill) fill.style.setProperty('--msc-progress-pct', `${pct}%`);
    if (curr) curr.textContent = `${Math.floor(audio.currentTime / 60)}:${String(Math.floor(audio.currentTime % 60)).padStart(2, '0')}`;
    if (total) total.textContent = `${Math.floor(audio.duration / 60)}:${String(Math.floor(audio.duration % 60)).padStart(2, '0')}`;
  };

  audio.onended = () => {
    if (repeatMode === 'one') {
      cargarYReproducir(currentTrackIndex, true);
      return;
    }
    const nextIdx = obtenerSiguienteIndex(true);
    if (nextIdx >= playlistActual.length) {
      if (repeatMode === 'all') {
        cargarYReproducir(0, true);
      } else {
        // repeatMode === 'off'
        isPlaying = false;
        audio.currentTime = 0;
        refrescarUICompleta();
      }
    } else {
      cargarYReproducir(nextIdx, true);
    }
  };

  // Cargar origen de audio inicial sin reproducir para obtener duración
  const trackInicial = playlistActual[currentTrackIndex] || playlistActual[0];
  if (trackInicial) {
    const srcSeguro = resolverUrlPista(trackInicial);
    if (audio.src !== srcSeguro) {
      audio.src = srcSeguro;
      audio.load();
    }
  }

  refrescarUICompleta();
}

// src/features/musica/musica.js
// Motor Principal de Reproducción de Audio Real (100% libre de inline styles)

import { obtenerListaPredeterminada } from '@features/musica/lista/lista.js';
import '@features/musica/musica.css';

const PLAYLIST_REALES = obtenerListaPredeterminada();

// Instancia única global de HTML5 Audio
const audio = new Audio();
let currentTrackIndex = 5; // Iniciar por defecto en mike posner (índice 5)
let isPlaying = false;

function formatearTiempo(segundos) {
  if (isNaN(segundos) || segundos < 0) return '0:00';
  const mins = Math.floor(segundos / 60);
  const secs = Math.floor(segundos % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function renderMusica() {
  const actual = PLAYLIST_REALES[currentTrackIndex] || PLAYLIST_REALES[0];

  return `
    <div class="musica_panel_card">
      <!-- 1. REPRODUCTOR EN VIVO (HERO PLAYER CARD) -->
      <div class="msc_hero_player">
        <span class="msc_now_playing_tag">REPRODUCIENDO AHORA</span>
        <h4 class="msc_track_title_now" id="msc_now_title">${actual.titulo}</h4>

        <!-- Barra de Tiempo Interactiva -->
        <div class="msc_timeline_wrap">
          <span class="msc_time_text" id="msc_time_curr">0:00</span>
          <div class="msc_progress_bar_container" id="msc_progress_bar">
            <div class="msc_progress_fill_cyan" id="msc_progress_fill">
              <div class="msc_progress_thumb"></div>
            </div>
          </div>
          <span class="msc_time_text" id="msc_time_total">--:--</span>
        </div>

        <!-- Botones de Control con Play Circular Cian -->
        <div class="msc_controls_row">
          <button class="msc_ctrl_btn" id="msc_btn_repeat" title="Repetir"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="msc_ctrl_btn" id="msc_btn_prev" title="Anterior"><i class="fa-solid fa-backward-step"></i></button>
          <button class="msc_ctrl_btn play_cyan_btn" id="msc_main_play_btn" title="Reproducir / Pausar">
            <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
          </button>
          <button class="msc_ctrl_btn" id="msc_btn_next" title="Siguiente"><i class="fa-solid fa-forward-step"></i></button>
          <button class="msc_ctrl_btn" id="msc_btn_fav" title="Favorito"><i class="fa-solid fa-heart"></i></button>
        </div>

        <!-- Meta info de la pista -->
        <div class="msc_meta_bar">
          <span id="msc_meta_text">MP3 · ${actual.peso} · ${PLAYLIST_REALES.length} Canciones</span>
          <span id="msc_path_text">Ruta: ...\\musica\\lista\\ <i class="fa-regular fa-copy"></i></span>
        </div>
      </div>

      <!-- 2. BARRA DE BÚSQUEDA Y FILTRO -->
      <div class="msc_search_bar">
        <div class="msc_search_input_wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" class="msc_search_input" id="msc_search_input" placeholder="Buscar por título (Presiona Enter)..." />
        </div>
        <select class="msc_sort_select" id="msc_sort_select">
          <option value="az">Título (A - Z)</option>
          <option value="id">Por Defecto</option>
        </select>
      </div>

      <!-- 3. LISTA DE CANCIONES SCROLLABLE (TOP 5 VISIBLE) -->
      <div class="msc_track_list_scroll" id="msc_track_list">
        ${renderPlaylistItems(PLAYLIST_REALES, currentTrackIndex)}
      </div>

      <!-- 4. BARRA SELECTORA DE CARPETA (AL FINAL DE TODO) -->
      <div class="msc_folder_bar">
        <input type="text" class="msc_folder_input" value="src\\features\\musica\\lista" readonly />
        <button class="msc_btn_action" id="msc_btn_select_folder">
          <i class="fa-solid fa-folder-open"></i> Seleccionar
        </button>
        <button class="msc_btn_icon_only" id="msc_btn_refresh" title="Actualizar"><i class="fa-solid fa-rotate"></i></button>
        <button class="msc_btn_add" id="msc_btn_add" title="Agregar Pistas"><i class="fa-solid fa-plus"></i></button>
      </div>
    </div>
  `;
}

function renderPlaylistItems(playlist, activeIdx) {
  return playlist.map((item, i) => {
    const esActivo = i === activeIdx;
    return `
      <div class="msc_track_card_item ${esActivo ? 'active' : ''}" data-idx="${i}">
        <div class="msc_track_item_left">
          <span class="msc_track_idx">${item.id}</span>
          <div class="msc_track_meta_mini">
            <span class="msc_track_name_mini" title="${item.titulo}">${item.titulo}</span>
            <span class="msc_track_sub_mini">${item.peso} · MP3</span>
          </div>
        </div>
        <div class="msc_track_item_right">
          <i class="fa-regular fa-heart msc_fav_icon_mini"></i>
          <button class="msc_btn_play_mini ${esActivo && isPlaying ? 'pause_mini' : ''}">
            <i class="fa-solid ${esActivo && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function bindMusicaEvents(container) {
  const mainPlayBtn = container.querySelector('#msc_main_play_btn');
  const prevBtn = container.querySelector('#msc_btn_prev');
  const nextBtn = container.querySelector('#msc_btn_next');
  const progressBar = container.querySelector('#msc_progress_bar');
  const progressFill = container.querySelector('#msc_progress_fill');
  const timeCurrEl = container.querySelector('#msc_time_curr');
  const timeTotalEl = container.querySelector('#msc_time_total');
  const titleNowEl = container.querySelector('#msc_now_title');
  const metaTextEl = container.querySelector('#msc_meta_text');
  const searchInput = container.querySelector('#msc_search_input');

  function cargarYReproducir(index, autoPlay = true) {
    if (index < 0) index = PLAYLIST_REALES.length - 1;
    if (index >= PLAYLIST_REALES.length) index = 0;
    currentTrackIndex = index;

    const track = PLAYLIST_REALES[currentTrackIndex];
    if (audio.src !== track.url) {
      audio.src = track.url;
    }

    if (titleNowEl) titleNowEl.textContent = track.titulo;
    if (metaTextEl) metaTextEl.textContent = `MP3 · ${track.peso} · ${PLAYLIST_REALES.length} Canciones`;

    actualizarListaDOM(container);

    if (autoPlay) {
      audio.play().then(() => {
        isPlaying = true;
        actualizarBotonPlay(mainPlayBtn, true);
      }).catch(err => {
        console.warn('AutoPlay prevenido:', err);
      });
    }
  }

  function actualizarBotonPlay(btn, jugando) {
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (jugando) {
      if (icon) icon.className = 'fa-solid fa-pause';
      btn.title = 'Pausar';
    } else {
      if (icon) icon.className = 'fa-solid fa-play';
      btn.title = 'Reproducir';
    }
  }

  function actualizarListaDOM(c) {
    const list = c.querySelector('#msc_track_list');
    if (list) {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const filtrados = PLAYLIST_REALES.filter(p => p.titulo.toLowerCase().includes(q));
      list.innerHTML = renderPlaylistItems(filtrados, currentTrackIndex);
      bindListaClicks(c);
    }
  }

  function bindListaClicks(c) {
    c.querySelectorAll('.msc_track_card_item').forEach(card => {
      card.addEventListener('click', () => {
        const idx = Number(card.dataset.idx);
        if (idx === currentTrackIndex) {
          if (isPlaying) {
            audio.pause();
            isPlaying = false;
            actualizarBotonPlay(mainPlayBtn, false);
          } else {
            audio.play();
            isPlaying = true;
            actualizarBotonPlay(mainPlayBtn, true);
          }
        } else {
          cargarYReproducir(idx, true);
        }
      });
    });
  }

  if (mainPlayBtn) {
    mainPlayBtn.addEventListener('click', () => {
      if (!audio.src) {
        cargarYReproducir(currentTrackIndex, true);
        return;
      }
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        actualizarBotonPlay(mainPlayBtn, false);
      } else {
        audio.play();
        isPlaying = true;
        actualizarBotonPlay(mainPlayBtn, true);
      }
      actualizarListaDOM(container);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      cargarYReproducir(currentTrackIndex - 1, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      cargarYReproducir(currentTrackIndex + 1, true);
    });
  }

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      if (progressFill) progressFill.style.setProperty('--msc-progress-pct', `${pct}%`);
      if (timeCurrEl) timeCurrEl.textContent = formatearTiempo(audio.currentTime);
      if (timeTotalEl) timeTotalEl.textContent = formatearTiempo(audio.duration);
    }
  });

  audio.addEventListener('ended', () => {
    cargarYReproducir(currentTrackIndex + 1, true);
  });

  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      if (audio.duration) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pos * audio.duration;
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      actualizarListaDOM(container);
    });
  }

  bindListaClicks(container);
}

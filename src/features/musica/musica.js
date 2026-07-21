// src/features/musica/musica.js
// Motor Principal de Reproducción de Audio Real (100% libre de inline styles)

import { obtenerListaPredeterminada } from '@features/musica/lista/lista.js';
import { savels, getls } from '@core/widev/storage.js';
import { wiTip } from '@core/widev/witip.js';
import '@features/musica/musica.css';

const PLAYLIST_REALES = obtenerListaPredeterminada();
const STORAGE_KEY = 'musicawii';

// ── Carga estado persistido ──────────────────────────────────────────────────
function cargarEstado() {
  const guardado = getls(STORAGE_KEY);
  return {
    trackIndex: guardado?.trackIndex ?? 5,
    likes:      guardado?.likes      ?? [],
    filtro:     'todos' // filtro nunca se persiste, siempre inicia en todos
  };
}

function guardarEstado() {
  savels(STORAGE_KEY, {
    trackIndex: currentTrackIndex,
    likes:      likes
  }, 8760); // 1 año
}

// ── Estado en memoria ─────────────────────────────────────────────────────────
const estado = cargarEstado();
let currentTrackIndex = estado.trackIndex;
let likes             = estado.likes;      // array de IDs con like
let filtroActivo      = estado.filtro;     // 'todos' | 'favoritos'
let isPlaying         = false;

const audio = new Audio();

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatearTiempo(s) {
  if (isNaN(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function tienelike(id) { return likes.includes(id); }

function toggleLike(id) {
  if (tienelike(id)) {
    likes = likes.filter(l => l !== id);
  } else {
    likes.push(id);
  }
  guardarEstado();
}

function playlistFiltrada(query = '') {
  let lista = PLAYLIST_REALES;
  if (filtroActivo === 'favoritos') lista = lista.filter(t => tienelike(t.id));
  if (query) lista = lista.filter(t => t.titulo.toLowerCase().includes(query.toLowerCase()));
  return lista;
}

// ── Render HTML ───────────────────────────────────────────────────────────────
export function renderMusica() {
  const actual = PLAYLIST_REALES[currentTrackIndex] || PLAYLIST_REALES[0];

  return `
    <div class="musica_panel_card">

      <!-- 1. HERO PLAYER -->
      <div class="msc_hero_player">
        <span class="msc_now_playing_tag">♪ REPRODUCIENDO AHORA</span>
        <h4 class="msc_track_title_now" id="msc_now_title">${actual.titulo}</h4>

        <!-- Barra de progreso -->
        <div class="msc_timeline_wrap">
          <span class="msc_time_text" id="msc_time_curr">0:00</span>
          <div class="msc_progress_bar_container" id="msc_progress_bar">
            <div class="msc_progress_fill_cyan" id="msc_progress_fill">
              <div class="msc_progress_thumb"></div>
            </div>
          </div>
          <span class="msc_time_text" id="msc_time_total">--:--</span>
        </div>

        <!-- Controles -->
        <div class="msc_controls_row">
          <button class="msc_ctrl_btn" id="msc_btn_repeat"
            data-witip="Repetir" data-wtipo="top">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
          <button class="msc_ctrl_btn" id="msc_btn_prev"
            data-witip="Anterior" data-wtipo="top">
            <i class="fa-solid fa-backward-step"></i>
          </button>
          <button class="msc_ctrl_btn play_cyan_btn" id="msc_main_play_btn"
            data-witip="Reproducir / Pausar" data-wtipo="top">
            <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
          </button>
          <button class="msc_ctrl_btn" id="msc_btn_next"
            data-witip="Siguiente" data-wtipo="top">
            <i class="fa-solid fa-forward-step"></i>
          </button>
          <button class="msc_ctrl_btn ${tienelike(actual.id) ? 'liked' : ''}" id="msc_btn_fav"
            data-witip="${tienelike(actual.id) ? 'Quitar favorito' : 'Agregar a favoritos'}" data-wtipo="top">
            <i class="fa-${tienelike(actual.id) ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>

        <!-- Meta -->
        <div class="msc_meta_bar">
          <span id="msc_meta_text">MP3 · ${actual.peso} · Modificado: ${actual.fecha}</span>
          <span id="msc_path_text" class="msc_path_copy" data-witip="Copiar ruta" data-wtipo="top">
            ..\\musica\\lista\\ <i class="fa-regular fa-copy"></i>
          </span>
        </div>
      </div>

      <!-- 2. FILTROS + BÚSQUEDA -->
      <div class="msc_search_bar">
        <div class="msc_filter_tabs">
          <button class="msc_filter_tab ${filtroActivo === 'todos' ? 'active' : ''}" data-filter="todos"
            data-witip="Todas las canciones" data-wtipo="top">
            <i class="fa-solid fa-music"></i> Todos
          </button>
          <button class="msc_filter_tab ${filtroActivo === 'favoritos' ? 'active' : ''}" data-filter="favoritos"
            data-witip="Solo favoritos" data-wtipo="top">
            <i class="fa-solid fa-heart"></i> Favoritos
            <span class="msc_fav_count" id="msc_fav_count">${likes.length}</span>
          </button>
        </div>
        <div class="msc_search_input_wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" class="msc_search_input" id="msc_search_input"
            placeholder="Buscar canción..." />
        </div>
        <select class="msc_sort_select" id="msc_sort_select"
          data-witip="Ordenar lista" data-wtipo="top">
          <option value="id">Por defecto</option>
          <option value="az">A → Z</option>
        </select>
      </div>

      <!-- 3. LISTA SCROLLABLE -->
      <div class="msc_track_list_scroll" id="msc_track_list">
        ${renderPlaylistItems(playlistFiltrada(), currentTrackIndex)}
      </div>

      <!-- 4. FOOTER CARPETA -->
      <div class="msc_folder_bar">
        <input type="text" class="msc_folder_input"
          value="src\\features\\musica\\lista" readonly />
        <button class="msc_btn_action" id="msc_btn_select_folder"
          data-witip="Seleccionar carpeta" data-wtipo="top">
          <i class="fa-solid fa-folder-open"></i> Seleccionar
        </button>
        <button class="msc_btn_icon_only" id="msc_btn_refresh"
          data-witip="Actualizar lista" data-wtipo="top">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <button class="msc_btn_add" id="msc_btn_add"
          data-witip="Agregar pistas" data-wtipo="top">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  `;
}

function renderPlaylistItems(playlist, activeIdx) {
  if (playlist.length === 0) {
    return `<div class="msc_empty_state">
      <i class="fa-solid fa-heart-crack"></i>
      <span>Sin canciones favoritas aún</span>
    </div>`;
  }

  return playlist.map((item) => {
    const esActivo = item.id === PLAYLIST_REALES[activeIdx]?.id;
    const liked = tienelike(item.id);
    const realIdx = PLAYLIST_REALES.findIndex(p => p.id === item.id);
    return `
      <div class="msc_track_card_item ${esActivo ? 'active' : ''}" data-idx="${realIdx}">
        <div class="msc_track_item_left">
          <span class="msc_track_idx">${String(item.id).padStart(2, '0')}</span>
          <div class="msc_track_meta_mini">
            <span class="msc_track_name_mini">${item.titulo}</span>
            <span class="msc_track_sub_mini">${item.peso} · MP3</span>
          </div>
        </div>
        <div class="msc_track_item_right">
          <button class="msc_fav_icon_mini ${liked ? 'liked' : ''}"
            data-track-id="${item.id}"
            data-witip="${liked ? 'Quitar favorito' : 'Agregar favorito'}" data-wtipo="top">
            <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <button class="msc_btn_play_mini ${esActivo && isPlaying ? 'pause_mini' : ''}"
            data-witip="${esActivo && isPlaying ? 'Pausar' : 'Reproducir'}" data-wtipo="top">
            <i class="fa-solid ${esActivo && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Eventos ───────────────────────────────────────────────────────────────────
export function bindMusicaEvents(container) {
  wiTip(); // inicializar sistema de tooltips

  const mainPlayBtn  = container.querySelector('#msc_main_play_btn');
  const prevBtn      = container.querySelector('#msc_btn_prev');
  const nextBtn      = container.querySelector('#msc_btn_next');
  const favBtn       = container.querySelector('#msc_btn_fav');
  const progressBar  = container.querySelector('#msc_progress_bar');
  const progressFill = container.querySelector('#msc_progress_fill');
  const timeCurrEl   = container.querySelector('#msc_time_curr');
  const timeTotalEl  = container.querySelector('#msc_time_total');
  const titleNowEl   = container.querySelector('#msc_now_title');
  const metaTextEl   = container.querySelector('#msc_meta_text');
  const searchInput  = container.querySelector('#msc_search_input');
  const sortSelect   = container.querySelector('#msc_sort_select');

  // ── Reproducción ───────────────────────────────────────────────────────────
  function cargarYReproducir(index, autoPlay = true) {
    if (index < 0) index = PLAYLIST_REALES.length - 1;
    if (index >= PLAYLIST_REALES.length) index = 0;
    currentTrackIndex = index;

    const track = PLAYLIST_REALES[currentTrackIndex];
    if (audio.src !== track.url) audio.src = track.url;

    if (titleNowEl) titleNowEl.textContent = track.titulo;
    actualizarMeta();
    actualizarBtnFav();
    actualizarListaDOM();
    guardarEstado();

    if (autoPlay) {
      audio.play().then(() => {
        isPlaying = true;
        actualizarIconPlay(mainPlayBtn, true);
      }).catch(err => console.warn('AutoPlay prevenido:', err));
    }
  }

  function actualizarIconPlay(btn, jugando) {
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (icon) icon.className = `fa-solid ${jugando ? 'fa-pause' : 'fa-play'}`;
    btn.setAttribute('data-witip', jugando ? 'Pausar' : 'Reproducir');
  }

  function actualizarMeta() {
    const track = PLAYLIST_REALES[currentTrackIndex];
    if (metaTextEl) {
      metaTextEl.innerHTML = `MP3 · ${track.peso} · Modificado: ${track.fecha}`;
    }
    const favCount = container.querySelector('#msc_fav_count');
    if (favCount) favCount.textContent = likes.length;
  }

  function actualizarBtnFav() {
    if (!favBtn) return;
    const track = PLAYLIST_REALES[currentTrackIndex];
    const liked = tienelike(track.id);
    const icon  = favBtn.querySelector('i');
    if (icon) icon.className = `fa-${liked ? 'solid' : 'regular'} fa-heart`;
    favBtn.classList.toggle('liked', liked);
    favBtn.setAttribute('data-witip', liked ? 'Quitar favorito' : 'Agregar a favoritos');
  }

  function actualizarListaDOM() {
    const list = container.querySelector('#msc_track_list');
    if (!list) return;
    const q = searchInput?.value?.trim() ?? '';
    let filtered = playlistFiltrada(q);

    if (sortSelect?.value === 'az') {
      filtered = [...filtered].sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
    list.innerHTML = renderPlaylistItems(filtered, currentTrackIndex);
    bindListaClicks();
  }

  // ── Clicks en la lista ─────────────────────────────────────────────────────
  function bindListaClicks() {
    // Click en card → reproducir
    container.querySelectorAll('.msc_track_card_item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.msc_fav_icon_mini') || e.target.closest('.msc_btn_play_mini')) return;
        const idx = Number(card.dataset.idx);
        if (idx === currentTrackIndex) {
          togglePlayPause();
        } else {
          cargarYReproducir(idx, true);
        }
      });
    });

    // Click en botón play mini
    container.querySelectorAll('.msc_btn_play_mini').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.msc_track_card_item');
        const idx = Number(card?.dataset.idx);
        if (idx === currentTrackIndex) {
          togglePlayPause();
        } else {
          cargarYReproducir(idx, true);
        }
      });
    });

    // Click en corazón mini → toggle like
    container.querySelectorAll('.msc_fav_icon_mini').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = Number(btn.dataset.trackId);
        toggleLike(trackId);

        const liked = tienelike(trackId);
        const icon  = btn.querySelector('i');
        if (icon) icon.className = `fa-${liked ? 'solid' : 'regular'} fa-heart`;
        btn.classList.toggle('liked', liked);
        btn.setAttribute('data-witip', liked ? 'Quitar favorito' : 'Agregar favorito');

        if (trackId === PLAYLIST_REALES[currentTrackIndex]?.id) {
          actualizarBtnFav();
        }
        actualizarMeta();

        if (filtroActivo === 'favoritos') {
          actualizarListaDOM();
        }
      });
    });
  }

  function togglePlayPause() {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      actualizarIconPlay(mainPlayBtn, false);
    } else {
      if (!audio.src) { cargarYReproducir(currentTrackIndex, true); return; }
      audio.play();
      isPlaying = true;
      actualizarIconPlay(mainPlayBtn, true);
    }
    actualizarListaDOM();
  }

  // ── Controles principales ─────────────────────────────────────────────────
  if (mainPlayBtn) mainPlayBtn.addEventListener('click', togglePlayPause);
  if (prevBtn)     prevBtn.addEventListener('click', () => cargarYReproducir(currentTrackIndex - 1, true));
  if (nextBtn)     nextBtn.addEventListener('click', () => cargarYReproducir(currentTrackIndex + 1, true));

  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const track = PLAYLIST_REALES[currentTrackIndex];
      toggleLike(track.id);
      actualizarBtnFav();
      actualizarMeta();
      actualizarListaDOM();
    });
  }

  // ── Filtros de tab ─────────────────────────────────────────────────────────
  container.querySelectorAll('.msc_filter_tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filtroActivo = tab.dataset.filter;
      container.querySelectorAll('.msc_filter_tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      actualizarListaDOM();
    });
  });

  // ── Búsqueda + Orden ──────────────────────────────────────────────────────
  if (searchInput) searchInput.addEventListener('input', () => actualizarListaDOM());
  if (sortSelect)  sortSelect.addEventListener('change', () => actualizarListaDOM());

  // ── Progreso de audio ─────────────────────────────────────────────────────
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.setProperty('--msc-progress-pct', `${pct}%`);
    if (timeCurrEl)   timeCurrEl.textContent  = formatearTiempo(audio.currentTime);
    if (timeTotalEl)  timeTotalEl.textContent = formatearTiempo(audio.duration);
  });

  audio.addEventListener('ended', () => cargarYReproducir(currentTrackIndex + 1, true));

  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  bindListaClicks();
}

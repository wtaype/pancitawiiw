// src/features/musica/componentes/musica_hero.js
// Subcomponente: Hero Player (Reproductor Principal, Barra de Progreso y Controles)

export function renderHero(track, isPlaying, liked, carpeta) {
  const actual = track || { titulo: 'Sin canción', peso: '0 MB', fecha: '-' };

  return `
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

      <!-- Controles principales -->
      <div class="msc_controls_row">
        <button class="msc_ctrl_btn" id="msc_btn_repeat" data-witip="Repetir" data-wtipo="top">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
        <button class="msc_ctrl_btn" id="msc_btn_prev" data-witip="Anterior" data-wtipo="top">
          <i class="fa-solid fa-backward-step"></i>
        </button>
        <button class="msc_ctrl_btn play_cyan_btn" id="msc_main_play_btn" data-witip="${isPlaying ? 'Pausar' : 'Reproducir'}" data-wtipo="top">
          <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
        </button>
        <button class="msc_ctrl_btn" id="msc_btn_next" data-witip="Siguiente" data-wtipo="top">
          <i class="fa-solid fa-forward-step"></i>
        </button>
        <button class="msc_ctrl_btn ${liked ? 'liked' : ''}" id="msc_btn_fav"
          data-witip="${liked ? 'Quitar favorito' : 'Agregar a favoritos'}" data-wtipo="top">
          <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
        </button>
      </div>

      <!-- Meta info -->
      <div class="msc_meta_bar">
        <span id="msc_meta_text">MP3 · ${actual.peso} · Modificado: ${actual.fecha}</span>
        <span id="msc_path_text" class="msc_path_copy" data-witip="Copiar ruta" data-wtipo="top">
          ${carpeta || '..\\musica\\lista\\'} <i class="fa-regular fa-copy"></i>
        </span>
      </div>
    </div>
  `;
}

export function bindHeroEvents(container, { onTogglePlay, onPrev, onNext, onToggleFav, onSeek }) {
  const mainPlayBtn = container.querySelector('#msc_main_play_btn');
  const prevBtn     = container.querySelector('#msc_btn_prev');
  const nextBtn     = container.querySelector('#msc_btn_next');
  const favBtn      = container.querySelector('#msc_btn_fav');
  const progressBar = container.querySelector('#msc_progress_bar');

  if (mainPlayBtn) mainPlayBtn.onclick = () => onTogglePlay();
  if (prevBtn)     prevBtn.onclick     = () => onPrev();
  if (nextBtn)     nextBtn.onclick     = () => onNext();
  if (favBtn)      favBtn.onclick      = () => onToggleFav();

  if (progressBar && typeof onSeek === 'function') {
    progressBar.onclick = (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      onSeek(pct);
    };
  }
}

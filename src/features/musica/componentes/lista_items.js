// src/features/musica/componentes/musica_lista_items.js
// Subcomponente: Lista Scrollable de Canciones Paginadas y Botones Mini (Play/Like)

export function renderListaItems(playlistFiltrada, page, tamanoPagina, playlistCompleta, activeTrackId, tienelikeFn, isPlaying) {
  if (!playlistFiltrada || playlistFiltrada.length === 0) {
    return `<div class="msc_empty_state">
      <i class="fa-solid fa-heart-crack"></i>
      <span>Sin canciones encontradas</span>
    </div>`;
  }

  const inicio = (page - 1) * tamanoPagina;
  const fin = inicio + tamanoPagina;
  const paginaItems = playlistFiltrada.slice(inicio, fin);

  return paginaItems.map((item) => {
    const esActivo = item.id === activeTrackId;
    const liked = tienelikeFn(item.id);
    const realIdx = playlistCompleta.findIndex(p => p.id === item.id);

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
          <button class="msc_fav_icon_mini ${liked ? 'liked' : ''}" data-track-id="${item.id}"
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

export function bindListaItemsEvents(container, { onTrackSelect, onPlayMini, onToggleFavMini }) {
  container.querySelectorAll('.msc_track_card_item').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.msc_fav_icon_mini') || e.target.closest('.msc_btn_play_mini')) return;
      const idx = Number(card.dataset.idx);
      onTrackSelect(idx);
    };
  });

  container.querySelectorAll('.msc_btn_play_mini').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const card = btn.closest('.msc_track_card_item');
      const idx = Number(card?.dataset.idx);
      onPlayMini(idx);
    };
  });

  container.querySelectorAll('.msc_fav_icon_mini').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const trackId = Number(btn.dataset.trackId);
      onToggleFavMini(trackId, btn);
    };
  });
}

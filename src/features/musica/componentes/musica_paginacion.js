// src/features/musica/componentes/musica_paginacion.js
// Subcomponente: Barra de Paginación de 10 en 10 con íconos de Chevron

export function renderPaginacion(paginaActual, totalPaginas, totalItems) {
  return `
    <div class="msc_pagination_bar" id="msc_pagination_bar">
      <button class="msc_page_btn" id="msc_page_prev" ${paginaActual <= 1 ? 'disabled' : ''}
        data-witip="Página anterior" data-wtipo="top">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <span class="msc_page_info" id="msc_page_info">Página ${paginaActual} de ${totalPaginas} (${totalItems} temas)</span>
      <button class="msc_page_btn" id="msc_page_next" ${paginaActual >= totalPaginas ? 'disabled' : ''}
        data-witip="Página siguiente" data-wtipo="top">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;
}

export function bindPaginacionEvents(container, { onPrevPage, onNextPage }) {
  const btnPrev = container.querySelector('#msc_page_prev');
  const btnNext = container.querySelector('#msc_page_next');

  if (btnPrev) btnPrev.onclick = () => onPrevPage();
  if (btnNext) btnNext.onclick = () => onNextPage();
}

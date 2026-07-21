// src/features/musica/componentes/musica_filtros.js
// Subcomponente: Barra de Filtros, Buscador, Ordenación, Paginación Superior (< >) y Acciones (+ / Refresh)

export function renderFiltros(filtroActivo, totalTodos, totalLikes, paginaActual, totalPaginas) {
  return `
    <div class="msc_search_bar">
      <!-- Tabs con conteos integrados -->
      <div class="msc_filter_tabs">
        <button class="msc_filter_tab ${filtroActivo === 'todos' ? 'active' : ''}" data-filter="todos"
          data-witip="Todas las canciones" data-wtipo="top">
          <i class="fa-solid fa-music"></i> Todos (${totalTodos})
        </button>
        <button class="msc_filter_tab ${filtroActivo === 'favoritos' ? 'active' : ''}" data-filter="favoritos"
          data-witip="Solo favoritos" data-wtipo="top">
          <i class="fa-solid fa-heart"></i> Favoritos (${totalLikes})
        </button>
      </div>

      <!-- Buscador -->
      <div class="msc_search_input_wrap">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" class="msc_search_input" id="msc_search_input" placeholder="Buscar canción..." />
      </div>

      <!-- Orden -->
      <select class="msc_sort_select" id="msc_sort_select" data-witip="Ordenar lista" data-wtipo="top">
        <option value="id">Por defecto</option>
        <option value="az">A → Z</option>
      </select>

      <!-- Botones Paginación Superior (Solo Íconos < >) y Acciones -->
      <div class="msc_top_action_btns">
        <button class="msc_top_act_btn nav_page_btn" id="msc_btn_page_prev_top" ${paginaActual <= 1 ? 'disabled' : ''}
          data-witip="Página anterior" data-wtipo="top">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button class="msc_top_act_btn nav_page_btn" id="msc_btn_page_next_top" ${paginaActual >= totalPaginas ? 'disabled' : ''}
          data-witip="Página siguiente" data-wtipo="top">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <button class="msc_top_act_btn" id="msc_btn_refresh_top" data-witip="Actualizar carpeta" data-wtipo="top">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <button class="msc_top_act_btn add_btn" id="msc_btn_add_top" data-witip="Agregar carpeta o música" data-wtipo="top">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  `;
}

export function bindFiltrosEvents(container, { onFilterChange, onSearch, onSort, onPrevPage, onNextPage, onRefresh, onAdd }) {
  const tabs             = container.querySelectorAll('.msc_filter_tab');
  const searchInput      = container.querySelector('#msc_search_input');
  const sortSelect       = container.querySelector('#msc_sort_select');
  const btnPagePrevTop   = container.querySelector('#msc_btn_page_prev_top');
  const btnPageNextTop   = container.querySelector('#msc_btn_page_next_top');
  const btnRefreshTop    = container.querySelector('#msc_btn_refresh_top');
  const btnAddTop        = container.querySelector('#msc_btn_add_top');

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      onFilterChange(tab.dataset.filter);
    };
  });

  if (searchInput) searchInput.oninput = () => onSearch(searchInput.value.trim());
  if (sortSelect)  sortSelect.onchange  = () => onSort(sortSelect.value);

  if (btnPagePrevTop) btnPagePrevTop.onclick = () => onPrevPage();
  if (btnPageNextTop) btnPageNextTop.onclick = () => onNextPage();

  if (btnRefreshTop) btnRefreshTop.onclick = () => onRefresh(btnRefreshTop);
  if (btnAddTop)     btnAddTop.onclick     = () => onAdd();
}

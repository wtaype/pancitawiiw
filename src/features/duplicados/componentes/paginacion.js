// src/features/duplicados/componentes/paginacion.js
// Componente reutilizable de controles de paginación (20 ítems por página - Estilo Música)

import { wiTip } from '@widev';
import './paginacion.css';

export function renderPaginacion(container, totalItems, paginaActual, tamanoPagina = 20, onCambiarPagina) {
  if (totalItems <= tamanoPagina) {
    container.innerHTML = '';
    return;
  }

  const totalPaginas = Math.ceil(totalItems / tamanoPagina);
  const esPrimera = paginaActual <= 1;
  const esUltima = paginaActual >= totalPaginas;

  const html = `
    <div class="dup_paginacion_wrapper">
      <div class="dup_paginacion_info">
        <i class="fa-solid fa-list-ol"></i>
        <span>Mostrando <b>${(paginaActual - 1) * tamanoPagina + 1} - ${Math.min(paginaActual * tamanoPagina, totalItems)}</b> de <b>${totalItems}</b> grupos</span>
      </div>

      <div class="dup_paginacion_controls">
        <button id="dup_pag_btn_prev" class="dup_btn_pag" ${esPrimera ? 'disabled' : ''} data-witip="Página anterior">
          <i class="fa-solid fa-chevron-left"></i> Anterior
        </button>

        <span class="dup_pag_page_badge">Página ${paginaActual} de ${totalPaginas}</span>

        <button id="dup_pag_btn_next" class="dup_btn_pag" ${esUltima ? 'disabled' : ''} data-witip="Página siguiente">
          Siguiente <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  if (typeof wiTip === 'function') wiTip();

  const btnPrev = container.querySelector('#dup_pag_btn_prev');
  const btnNext = container.querySelector('#dup_pag_btn_next');

  if (btnPrev && !esPrimera) {
    btnPrev.onclick = () => onCambiarPagina(paginaActual - 1);
  }

  if (btnNext && !esUltima) {
    btnNext.onclick = () => onCambiarPagina(paginaActual + 1);
  }
}

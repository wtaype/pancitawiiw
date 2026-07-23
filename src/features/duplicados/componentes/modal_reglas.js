// src/features/duplicados/componentes/modal_reglas.js
// Modal de selección automatizada inteligente con 1-clic

import { wiTip } from '@widev';
import './modal_reglas.css';

export function renderModalReglas(onSeleccionarRegla) {
  const antiguo = document.getElementById('dup_modal_reglas_root');
  if (antiguo) antiguo.remove();

  const html = `
    <div id="dup_modal_reglas_root" class="dup_reglas_modal_overlay active">
      <div class="dup_reglas_modal_card">
        <div class="dup_reglas_header">
          <div class="dup_reglas_title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <h3>Auto-Selección Inteligente</h3>
          </div>
          <button id="dup_btn_close_reglas" class="dup_hd_modal_close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="dup_reglas_options_list">
          <button class="dup_regla_option_btn" data-regla="conservar_antiguo">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <div class="dup_regla_option_info">
              <h4>Conservar el archivo más antiguo</h4>
              <p>Marca automáticamente para eliminar todos los archivos más recientes de cada grupo.</p>
            </div>
          </button>

          <button class="dup_regla_option_btn" data-regla="conservar_nuevo">
            <i class="fa-solid fa-sparkles"></i>
            <div class="dup_regla_option_info">
              <h4>Conservar el archivo más reciente</h4>
              <p>Marca automáticamente para eliminar todos los archivos más viejos de cada grupo.</p>
            </div>
          </button>

          <button class="dup_regla_option_btn" data-regla="marcar_todos_menos_uno">
            <i class="fa-solid fa-list-check"></i>
            <div class="dup_regla_option_info">
              <h4>Conservar el primero de cada lista</h4>
              <p>Mantiene intacto el primer archivo encontrado y marca el resto para limpieza.</p>
            </div>
          </button>

          <button class="dup_regla_option_btn" data-regla="desmarcar_todos">
            <i class="fa-solid fa-arrow-rotate-left"></i>
            <div class="dup_regla_option_info">
              <h4>Deseleccionar todos</h4>
              <p>Limpia todas las marcas actuales de selección.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  if (typeof wiTip === 'function') wiTip();

  const modalRoot = document.getElementById('dup_modal_reglas_root');
  const btnClose = document.getElementById('dup_btn_close_reglas');

  const cerrar = () => {
    if (modalRoot) {
      modalRoot.classList.remove('active');
      setTimeout(() => modalRoot.remove(), 250);
    }
  };

  if (btnClose) btnClose.onclick = cerrar;

  modalRoot.querySelectorAll('.dup_regla_option_btn').forEach(btn => {
    btn.onclick = () => {
      const regla = btn.getAttribute('data-regla');
      onSeleccionarRegla(regla);
      cerrar();
    };
  });

  modalRoot.onclick = (e) => {
    if (e.target === modalRoot) cerrar();
  };
}

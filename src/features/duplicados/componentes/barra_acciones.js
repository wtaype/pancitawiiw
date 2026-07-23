// src/features/duplicados/componentes/barra_acciones.js
// Barra flotante inferior de acciones conectada a la eliminación a Papelera con confirmación

import { formatearBytes } from '../lib/filtros.js';
import { wiConfirmar, wiTip } from '@widev';
import './barra_acciones.css';

export function renderBarraAcciones(container, rutasSeleccionadas, grupos, onAbrirReglas, onEliminarConfirmado) {
  let barra = container.querySelector('#dup_barra_acciones_root');
  
  const totalArchivos = rutasSeleccionadas.size;
  const bytesRecuperables = calcularBytesMarcados(rutasSeleccionadas, grupos);

  if (totalArchivos === 0) {
    if (barra) barra.classList.remove('active');
    return;
  }

  if (!barra) {
    const html = `
      <div id="dup_barra_acciones_root" class="dup_barra_acciones_sticky">
        <div class="dup_barra_info">
          <i class="fa-solid fa-square-check"></i>
          <div class="dup_barra_text">
            <h4 id="dup_barra_count_txt">0 archivos marcados</h4>
            <p id="dup_barra_bytes_txt">0 MB de espacio a recuperar</p>
          </div>
        </div>

        <div class="dup_barra_btns">
          <button id="dup_btn_abrir_reglas" class="dup_btn_reglas" data-witip="Reglas de selección automática en 1-clic">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Selección
          </button>
          
          <button id="dup_btn_ejecutar_papelera" class="dup_btn_eliminar_papelera" data-witip="Enviar archivos marcados a la Papelera de Reciclaje">
            <i class="fa-solid fa-trash-can"></i> Mover a la Papelera
          </button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    barra = container.querySelector('#dup_barra_acciones_root');
  }

  // Actualizar textos
  const countTxt = barra.querySelector('#dup_barra_count_txt');
  const bytesTxt = barra.querySelector('#dup_barra_bytes_txt');

  if (countTxt) countTxt.textContent = `${totalArchivos} archivo${totalArchivos > 1 ? 's' : ''} seleccionado${totalArchivos > 1 ? 's' : ''}`;
  if (bytesTxt) bytesTxt.textContent = `${formatearBytes(bytesRecuperables)} de espacio a recuperar`;

  barra.classList.add('active');

  if (typeof wiTip === 'function') wiTip();

  // Event Listeners
  const btnReglas = barra.querySelector('#dup_btn_abrir_reglas');
  if (btnReglas) btnReglas.onclick = onAbrirReglas;

  const btnPapelera = barra.querySelector('#dup_btn_ejecutar_papelera');
  if (btnPapelera) {
    btnPapelera.onclick = async () => {
      const msj = `¿Estás seguro de mover ${totalArchivos} archivo(s) duplicado(s) (${formatearBytes(bytesRecuperables)}) a la Papelera de Reciclaje? Podrás restaurarlos en cualquier momento desde Windows.`;
      
      if (typeof wiConfirmar === 'function') {
        const ok = await wiConfirmar(msj, 'Mover a Papelera');
        if (ok) onEliminarConfirmado();
      } else {
        if (window.confirm(msj)) onEliminarConfirmado();
      }
    };
  }
}

function calcularBytesMarcados(rutasSeleccionadas, grupos) {
  let total = 0;
  grupos.forEach(grupo => {
    grupo.archivos.forEach(arch => {
      if (rutasSeleccionadas.has(arch.ruta)) {
        total += arch.tamano_bytes;
      }
    });
  });
  return total;
}

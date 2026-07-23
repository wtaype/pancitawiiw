// src/features/duplicados/secciones/escaner_config.js
// Panel superior de configuración y selección de carpetas para el escaneo

import { seleccionarCarpetaNativa } from '../lib/api.js';
import { wiTip, wiSelect } from '@widev';
import './escaner_config.css';

export function renderEscanerConfig(container, state, onIniciarEscaneo) {
  container.innerHTML = `
    <div class="dup_tab_config_card">
      <div class="dup_tab_config_header">
        <div class="dup_tab_config_title">
          <i class="fa-solid fa-folder-open"></i>
          <div>
            <h3>Seleccionar Carpetas para Escanear</h3>
            <p>Elige las ubicaciones o unidades donde buscarás archivos duplicados.</p>
          </div>
        </div>
        <button id="dup_tab_btn_agregar_carpeta" class="dup_tab_btn_agregar" data-witip="Explorar y añadir carpetas de tu PC">
          <i class="fa-solid fa-folder-plus"></i> Agregar Carpeta
        </button>
      </div>

      <div id="dup_tab_lista_carpetas" class="dup_tab_carpetas_wrapper">
        ${state.rutas.length === 0 
          ? `<span class="dup_tab_chip_empty"><i class="fa-solid fa-info-circle"></i> Ninguna carpeta seleccionada. Agrega una para comenzar.</span>`
          : state.rutas.map((ruta, index) => `
              <div class="dup_tab_chip">
                <i class="fa-solid fa-folder"></i>
                <span class="dup_tab_chip_path" title="${ruta}">${ruta}</span>
                <button class="dup_tab_chip_remove" data-index="${index}" data-witip="Quitar carpeta"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `).join('')}
      </div>

      <div class="dup_tab_config_opciones">
        <div class="dup_tab_input_group">
          <label><i class="fa-solid fa-filter"></i> Filtro Rápido:</label>
          <select id="dup_tab_select_categoria" class="dup_tab_select">
            <option value="todos">Todos los Archivos</option>
            <option value="imagenes">Sólo Imágenes (JPG, PNG, WebP...)</option>
            <option value="videos">Sólo Videos (MP4, MKV, AVI...)</option>
            <option value="musica">Sólo Música (MP3, WAV, FLAC...)</option>
            <option value="documentos">Sólo Documentos (PDF, DOCX, TXT, HTML...)</option>
          </select>
        </div>

        <div class="dup_tab_input_group">
          <label><i class="fa-solid fa-weight-hanging"></i> Tamaño Mínimo:</label>
          <select id="dup_tab_select_tamano" class="dup_tab_select">
            <option value="0" selected>Cualquier tamaño (> 0 KB)</option>
            <option value="1">Mayor a 1 KB</option>
            <option value="100">Mayor a 100 KB</option>
            <option value="1024">Mayor a 1 MB</option>
            <option value="10240">Mayor a 10 MB</option>
            <option value="102400">Mayor a 100 MB</option>
          </select>
        </div>

        <button id="dup_tab_btn_escanear" class="dup_tab_btn_escanear" ${state.rutas.length === 0 ? 'disabled' : ''} data-witip="Iniciar análisis de duplicados en 3 etapas">
          <i class="fa-solid fa-bolt"></i> Iniciar Escaneo Ultrarrápido
        </button>
      </div>
    </div>
  `;

  // Inicializar tooltips y selectores avanzados de widev
  if (typeof wiTip === 'function') wiTip();
  if (typeof wiSelect === 'function') {
    container.querySelectorAll('.dup_tab_select').forEach(sel => wiSelect(sel));
  }

  // Event Listeners
  const btnAgregar = container.querySelector('#dup_tab_btn_agregar_carpeta');
  if (btnAgregar) {
    btnAgregar.onclick = async () => {
      const ruta = await seleccionarCarpetaNativa();
      if (ruta && !state.rutas.includes(ruta)) {
        state.rutas.push(ruta);
        renderEscanerConfig(container, state, onIniciarEscaneo);
      }
    };
  }

  container.querySelectorAll('.dup_tab_chip_remove').forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (!isNaN(idx)) {
        state.rutas.splice(idx, 1);
        renderEscanerConfig(container, state, onIniciarEscaneo);
      }
    };
  });

  const btnEscanear = container.querySelector('#dup_tab_btn_escanear');
  if (btnEscanear) {
    btnEscanear.onclick = () => {
      const categoria = container.querySelector('#dup_tab_select_categoria').value;
      const valTamano = parseInt(container.querySelector('#dup_tab_select_tamano').value, 10);
      const tamanoKB = valTamano * 1024;
      onIniciarEscaneo({ categoria, tamanoKB });
    };
  }
}

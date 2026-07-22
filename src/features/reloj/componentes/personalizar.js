// src/features/reloj/componentes/personalizar.js
// Panel interactivo premium de personalización avanzada de reloj en tiempo real (In-page)

import { getls, savels, wiSelect } from '@widev';
import { rutas } from '@core/rutas.js';
import './personalizar.css';

const CONFIG_POR_DEFECTO = {
  color: 'neon-cyan',
  glow: true,
  fontFamily: 'Orbitron',
  fontSize: 48, // En píxeles
  format24h: false,
  showSeconds: true,
  showDate: false
};

export function arrancarPersonalizar(panel, onUpdateCallback) {
  const config = getls('wi_clock_config') || { ...CONFIG_POR_DEFECTO };

  // Control de retrocompatibilidad
  let currentSize = parseInt(config.fontSize, 10);
  if (isNaN(currentSize)) {
    currentSize = 48;
  }
  config.fontSize = currentSize;

  panel.innerHTML = `
    <div class="clock_pers_container">
      <div class="clock_pers_columns">
        
        <!-- Columna 1: Estilos e Iluminación -->
        <div class="clock_pers_col">
          <h4 class="clock_pers_col_title">
            <i class="fa-solid fa-palette"></i> Estilo e Iluminación
          </h4>
          
          <!-- Preset de Colores -->
          <div class="clock_config_group">
            <span class="clock_config_label">Preset de Color Neón</span>
            <div class="clock_color_palette" id="clock_color_palette">
              <button class="clock_color_dot neon-cyan ${config.color === 'neon-cyan' ? 'active' : ''}" data-color="neon-cyan" title="Celeste Neón"></button>
              <button class="clock_color_dot neon-green ${config.color === 'neon-green' ? 'active' : ''}" data-color="neon-green" title="Verde Matrix"></button>
              <button class="clock_color_dot neon-pink ${config.color === 'neon-pink' ? 'active' : ''}" data-color="neon-pink" title="Rosa Synthwave"></button>
              <button class="clock_color_dot neon-gold ${config.color === 'neon-gold' ? 'active' : ''}" data-color="neon-gold" title="Oro Cálido"></button>
              <button class="clock_color_dot neon-purple ${config.color === 'neon-purple' ? 'active' : ''}" data-color="neon-purple" title="Morado Eléctrico"></button>
              <button class="clock_color_dot retro-white ${config.color === 'retro-white' ? 'active' : ''}" data-color="retro-white" title="Blanco Clásico"></button>
            </div>
          </div>

          <!-- Brillo neón -->
          <div class="clock_config_row">
            <div class="clock_setting_info">
              <span class="clock_setting_title">Efecto Resplandor (Glow)</span>
              <span class="clock_setting_desc">Añade o quita la sombra iluminada neón en el texto.</span>
            </div>
            <label class="clock_ios_switch">
              <input type="checkbox" id="clock_opt_glow" ${config.glow ? 'checked' : ''} />
              <span class="clock_ios_slider"></span>
            </label>
          </div>

          <!-- Formato 24h -->
          <div class="clock_config_row">
            <div class="clock_setting_info">
              <span class="clock_setting_title">Formato de 24 Horas</span>
              <span class="clock_setting_desc">Muestra la hora militar sin AM/PM.</span>
            </div>
            <label class="clock_ios_switch">
              <input type="checkbox" id="clock_opt_format24h" ${config.format24h ? 'checked' : ''} />
              <span class="clock_ios_slider"></span>
            </label>
          </div>
        </div>

        <!-- Columna 2: Tipografía, Escala y Elementos -->
        <div class="clock_pers_col">
          <h4 class="clock_pers_col_title">
            <i class="fa-solid fa-font"></i> Tipografía y Elementos
          </h4>

          <!-- Tipografía -->
          <div class="clock_config_group">
            <span class="clock_config_label">Fuente Tipográfica</span>
            <select id="clock_opt_font" class="clock_select_native">
              <option value="Orbitron" ${config.fontFamily === 'Orbitron' ? 'selected' : ''}>Orbitron (Futurista)</option>
              <option value="Share Tech Mono" ${config.fontFamily === 'Share Tech Mono' ? 'selected' : ''}>Share Tech Mono (Código)</option>
              <option value="Courier New" ${config.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New (Retro Digital)</option>
              <option value="Outfit" ${config.fontFamily === 'Outfit' ? 'selected' : ''}>Outfit (Premium)</option>
              <option value="Inter" ${config.fontFamily === 'Inter' ? 'selected' : ''}>Inter (Limpia)</option>
            </select>
          </div>

          <!-- Tamaño (Range Slider) -->
          <div class="clock_config_group">
            <span class="clock_config_label" style="display: flex; justify-content: space-between;">
              <span>Tamaño de la Fuente</span>
              <span id="clock_size_val" style="color: var(--mco); font-weight: bold;">${config.fontSize}px</span>
            </span>
            <div style="display: flex; align-items: center; width: 100%; margin-top: 0.5vh;">
              <input type="range" id="clock_opt_size" min="20" max="200" value="${config.fontSize}" class="clock_range_slider" />
            </div>
          </div>

          <!-- Mostrar Segundos -->
          <div class="clock_config_row">
            <div class="clock_setting_info">
              <span class="clock_setting_title">Mostrar Segundos</span>
              <span class="clock_setting_desc">Habilita el segundero en vivo.</span>
            </div>
            <label class="clock_ios_switch">
              <input type="checkbox" id="clock_opt_seconds" ${config.showSeconds ? 'checked' : ''} />
              <span class="clock_ios_slider"></span>
            </label>
          </div>

          <!-- Mostrar Fecha -->
          <div class="clock_config_row">
            <div class="clock_setting_info">
              <span class="clock_setting_title">Mostrar Fecha debajo</span>
              <span class="clock_setting_desc">Agrega la fecha en español debajo del reloj.</span>
            </div>
            <label class="clock_ios_switch">
              <input type="checkbox" id="clock_opt_date" ${config.showDate ? 'checked' : ''} />
              <span class="clock_ios_slider"></span>
            </label>
          </div>
        </div>

      </div>

      <!-- Botón Salir -->
      <div class="clock_pers_actions">
        <button id="clock_btn_exit" class="clock_exit_btn">
          <i class="fa-solid fa-arrow-left"></i> Volver a Inicio
        </button>
      </div>
    </div>
  `;

  const guardarYActualizar = () => {
    savels('wi_clock_config', config, false);
    if (typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  };

  // 1. Selector de color
  const dots = panel.querySelectorAll('.clock_color_dot');
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      config.color = dot.getAttribute('data-color');
      guardarYActualizar();
    });
  });

  // 2. Glow
  const glow = panel.querySelector('#clock_opt_glow');
  glow?.addEventListener('change', (e) => {
    config.glow = e.target.checked;
    guardarYActualizar();
  });

  // 3. Formato 24h
  const format = panel.querySelector('#clock_opt_format24h');
  format?.addEventListener('change', (e) => {
    config.format24h = e.target.checked;
    guardarYActualizar();
  });

  // 4. Tipografía (wiSelect)
  const fontSelect = panel.querySelector('#clock_opt_font');
  if (fontSelect) {
    wiSelect(fontSelect, {
      placeholder: 'Selecciona una fuente...',
      onChange: (value) => {
        config.fontFamily = value;
        guardarYActualizar();
      }
    });
  }

  // 5. Tamaño (Range Slider)
  const sizeSlider = panel.querySelector('#clock_opt_size');
  const sizeValText = panel.querySelector('#clock_size_val');
  sizeSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    config.fontSize = val;
    if (sizeValText) {
      sizeValText.textContent = `${val}px`;
    }
    guardarYActualizar();
  });

  // 6. Segundos
  const seconds = panel.querySelector('#clock_opt_seconds');
  seconds?.addEventListener('change', (e) => {
    config.showSeconds = e.target.checked;
    guardarYActualizar();
  });

  // 7. Fecha
  const dateToggle = panel.querySelector('#clock_opt_date');
  dateToggle?.addEventListener('change', (e) => {
    config.showDate = e.target.checked;
    guardarYActualizar();
  });

  // 8. Botón Salir
  const btnExit = panel.querySelector('#clock_btn_exit');
  btnExit?.addEventListener('click', () => {
    rutas.navegar('/inicio');
  });
}

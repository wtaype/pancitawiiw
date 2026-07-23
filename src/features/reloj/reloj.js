// src/features/reloj/reloj.js
// Reloj Hero Neón Customizable (Sidebar widget con opciones avanzadas de personalización)

import { getls } from '@widev';
import { rutas } from '@core/rutas.js';
import { renderMicChatwii, initMicChatwiiEvents } from './componentes/mic_chatwii.js';
import '@features/reloj/reloj.css';

const CONFIG_POR_DEFECTO = {
  color: 'theme-auto',
  glow: true,
  fontFamily: 'Orbitron',
  fontSize: 48, // 48px por defecto
  format24h: false,
  showSeconds: true,
  showDate: false // Desactivado por defecto
};

export function renderReloj() {
  return `
    <div class="reloj_hero_card sidebar_only_clock" title="Doble clic para configurar">
      ${renderMicChatwii()}
      <div class="reloj_hero_clock_wrap">
        <div class="reloj_hero_clock" id="panel_hero_live_clock">
          00:00:00 p.m.
        </div>
        <div class="reloj_hero_date_sub" id="panel_hero_live_date">
          Fecha
        </div>
      </div>
    </div>
  `;
}

export function initRelojTimer(container) {
  const clockEl = container.querySelector('#panel_hero_live_clock');
  const dateEl = container.querySelector('#panel_hero_live_date');
  const wrapper = container.querySelector('#sidebar_reloj_wrapper');

  // Inicializar micrófono Alexa en el reloj
  initMicChatwiiEvents(container);

  function actualizarReloj() {
    const config = getls('wi_clock_config') || CONFIG_POR_DEFECTO;
    const ahora = new Date();
    
    // Formato de hora
    let timeStr = '';
    const hrs24 = ahora.getHours();
    const mins = String(ahora.getMinutes()).padStart(2, '0');
    const secs = String(ahora.getSeconds()).padStart(2, '0');
    
    if (config.format24h) {
      timeStr = `${String(hrs24).padStart(2, '0')}:${mins}`;
      if (config.showSeconds) {
        timeStr += `:${secs}`;
      }
    } else {
      const hrs12 = hrs24 % 12 || 12;
      const ampm = hrs24 >= 12 ? 'p.m.' : 'a.m.';
      timeStr = `${hrs12}:${mins}`;
      if (config.showSeconds) {
        timeStr += `:${secs}`;
      }
      timeStr += ` ${ampm}`;
    }

    if (clockEl) {
      clockEl.textContent = timeStr;
    }

    // Formato de fecha
    if (dateEl) {
      if (config.showDate) {
        const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
        let dateStr = ahora.toLocaleDateString('es-ES', opciones);
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        dateEl.textContent = dateStr;
        dateEl.style.display = 'block';
      } else {
        dateEl.style.display = 'none';
      }
    }
  }

  function aplicarConfig() {
    const config = getls('wi_clock_config') || CONFIG_POR_DEFECTO;
    if (!wrapper) return;

    // 1. Tipografía
    let fontValue = "'Orbitron', sans-serif";
    if (config.fontFamily === 'Share Tech Mono') fontValue = "'Share Tech Mono', monospace";
    else if (config.fontFamily === 'Courier New') fontValue = "'Courier New', monospace";
    else if (config.fontFamily === 'Outfit') fontValue = "'Outfit', sans-serif";
    else if (config.fontFamily === 'Inter') fontValue = "'Inter', sans-serif";
    wrapper.style.setProperty('--reloj-font-family', fontValue);
    
    // 2. Tamaño de fuente en px
    let fontSizeVal = parseInt(config.fontSize, 10);
    if (isNaN(fontSizeVal)) {
      fontSizeVal = 48; // Fallback
    }
    wrapper.style.setProperty('--reloj-font-size', `${fontSizeVal}px`);

    // 3. Color y Brillo (Glow)
    let colorHex = 'var(--tx1)'; 
    let glowColor = 'color-mix(in srgb, var(--mco) 45%, transparent)';
    if (config.color === 'theme-auto' || !config.color) {
      colorHex = 'var(--tx1)';
      glowColor = 'color-mix(in srgb, var(--mco) 45%, transparent)';
    } else if (config.color === 'neon-cyan') { colorHex = '#00f2fe'; glowColor = 'rgba(0, 242, 254, 0.6)'; }
    else if (config.color === 'neon-green') { colorHex = '#39ff14'; glowColor = 'rgba(57, 255, 20, 0.6)'; }
    else if (config.color === 'neon-pink') { colorHex = '#ff007f'; glowColor = 'rgba(255, 0, 127, 0.6)'; }
    else if (config.color === 'neon-gold') { colorHex = '#ffd700'; glowColor = 'rgba(255, 215, 0, 0.6)'; }
    else if (config.color === 'neon-purple') { colorHex = '#bd00ff'; glowColor = 'rgba(189, 0, 255, 0.6)'; }
    else if (config.color === 'retro-white') { colorHex = '#ffffff'; glowColor = 'rgba(255, 255, 255, 0.4)'; }
    
    wrapper.style.setProperty('--reloj-color-text', colorHex);
    wrapper.style.setProperty('--reloj-glow', config.glow ? `0 0 1.5vh ${glowColor}` : 'none');

    actualizarReloj();
  }

  // Escuchador de Doble Click para abrir el panel de personalización in-page (#wimain_content)
  wrapper?.addEventListener('dblclick', async () => {
    try {
      const panel = document.getElementById('wimain_content');
      if (!panel) return;
      
      // Forzar que el router registre la nueva ruta de personalización
      // para que al hacer clic en "Volver a Inicio" navegue de verdad
      rutas.rutaActual = '/personalizar_reloj';
      
      // Actualizar cabecera del panel principal
      const headerTitle = document.querySelector('.wii_header_title');
      const headerSub = document.querySelector('.wii_header_sub');
      const headerIcon = document.querySelector('.wii_header_icon i');
      if (headerTitle) headerTitle.textContent = "Personalizar Reloj";
      if (headerSub) headerSub.innerHTML = `<span class="wii_online_dot"></span> Personalización en vivo. Ajusta el estilo, colores y tamaño del reloj en tiempo real.`;
      if (headerIcon) headerIcon.className = `fa-solid fa-clock`;

      // Limpiar pestañas superiores
      const tabsWrapper = document.getElementById('wimain_tabs_wrapper');
      if (tabsWrapper) tabsWrapper.innerHTML = '';

      // Cargar componente
      const { arrancarPersonalizar } = await import('./componentes/personalizar.js');
      panel.innerHTML = '';
      arrancarPersonalizar(panel, aplicarConfig);
    } catch (err) {
      console.error('[Reloj] Error al cargar panel de personalización:', err);
    }
  });

  // Inicializar reloj
  aplicarConfig();
  const clockTimerId = setInterval(actualizarReloj, 1000);

  return () => {
    clearInterval(clockTimerId);
  };
}

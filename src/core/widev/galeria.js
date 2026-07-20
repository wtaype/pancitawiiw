// src/core/widev/galeria.js
// wiGaleria v2.2 — Visor de Imágenes estilo Picasa autocontenido y responsivo
// Inyección dinámica de CSS adaptado de workwii-web con animaciones de rebote (pop) y soporte táctil

import { abrirModal } from './modales.js';

const WIM_CSS_ID = 'wim-styles';

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(WIM_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = WIM_CSS_ID;
  style.textContent = `
    @keyframes wim_fade_in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes wim_cute_pop {
      from {
        transform: scale(0.92) translateY(-2.5vh);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }

    #wi_img_modal.active {
      animation: wim_fade_in 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    #wi_img_modal.active .modalBody.wim_body {
      animation: wim_cute_pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }

    #wi_img_modal .modalBody.wim_body {
      position: relative !important;
      display: block !important;
      background: rgba(10, 10, 15, 0.4) !important; /* Fondo premium translúcido oscuro */
      backdrop-filter: blur(28px) !important;
      -webkit-backdrop-filter: blur(28px) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      padding: 0 !important;
      border-radius: 2vh !important;
      overflow: hidden !important;
      width: 92% !important;
      max-width: 95vw !important; /* CRITICAL: Previene que witema.css lo acorte a 600px */
      height: 94vh !important;
      max-height: 94vh !important;
      box-sizing: border-box !important;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65) !important;
    }

    #wi_img_modal .wim_close {
      position: absolute !important;
      top: 2.2vh !important;
      right: 2.2vh !important;
      z-index: 12 !important;
      background: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      color: rgba(255, 255, 255, 0.85) !important;
      font-size: 0.95rem !important;
      cursor: pointer !important;
      line-height: 1 !important;
      border-radius: 50% !important;
      width: 32px !important;
      height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      transition: all 0.2s ease !important;
      text-shadow: none !important;
    }

    #wi_img_modal .wim_close:hover {
      background: rgba(220, 50, 50, 0.25) !important;
      border-color: rgba(220, 50, 50, 0.45) !important;
      color: #fff !important;
      transform: scale(1.08) !important;
    }

    .wim_stage {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: transparent !important;
      z-index: 1 !important;
      overflow: hidden !important;
    }

    .wim_img_wrap {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 2vh 8vh 13vh 8vh !important; /* Padding inferior para dejar espacio a leyendas y miniaturas */
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    .wim_img {
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      display: block !important;
      transition: opacity 0.22s ease, transform 0.1s linear !important;
      border-radius: 1vh !important;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5) !important;
      transform-origin: center center !important;
      cursor: zoom-in !important;
      will-change: transform, opacity !important;
      user-select: none !important;
    }

    .wim_img.wim_zoomed {
      cursor: grab !important;
    }

    .wim_img.wim_dragging {
      cursor: grabbing !important;
      transition: opacity 0.22s ease, transform 0s !important;
    }

    .wim_caption_row {
      position: absolute !important;
      bottom: 7.2vh !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 8 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 1.2vh !important;
      padding: 0.6vh 1.6vh !important;
      background: rgba(0, 0, 0, 0.35) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border-radius: 20px !important;
      max-width: 75% !important;
      white-space: nowrap !important;
      pointer-events: none !important;
    }

    .wim_caption {
      color: rgba(255, 255, 255, 0.85) !important;
      font-size: 0.8rem !important;
      font-style: italic !important;
      font-family: inherit !important;
      margin: 0 !important;
      text-align: center !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .wim_counter {
      color: rgba(255, 255, 255, 0.45) !important;
      font-size: 0.72rem !important;
      font-weight: 700 !important;
      white-space: nowrap !important;
      background: rgba(255, 255, 255, 0.08) !important;
      padding: 0.1vh 0.6vh !important;
      border-radius: 10px !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      line-height: 1.4 !important;
    }

    .wim_prev, .wim_next {
      position: absolute !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      background: rgba(255, 255, 255, 0.06) !important;
      color: rgba(255, 255, 255, 0.8) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 50% !important;
      width: 4.5vh !important;
      height: 4.5vh !important;
      min-width: 36px !important;
      min-height: 36px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 0.9rem !important;
      transition: all 0.22s cubic-bezier(.25, .46, .45, .94) !important;
      z-index: 10 !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    }

    .wim_prev { left: 2.2vh !important; }
    .wim_next { right: 2.2vh !important; }

    .wim_prev:hover, .wim_next:hover {
      background: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      color: #fff !important;
      transform: translateY(-50%) scale(1.08) !important;
    }

    .wim_prev:active, .wim_next:active {
      transform: translateY(-50%) scale(0.93) !important;
    }

    .wim_strip {
      position: absolute !important;
      bottom: 1.8vh !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 8 !important;
      display: flex !important;
      gap: 0.6vh !important;
      padding: 0.5vh 0.8vh !important;
      background: rgba(0, 0, 0, 0.22) !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border-radius: 1.2vh !important;
      max-width: 85% !important;
      overflow-x: auto !important;
      justify-content: center !important;
      flex-wrap: nowrap !important;
      scrollbar-width: none !important;
    }

    .wim_strip::-webkit-scrollbar {
      display: none !important;
    }

    .wim_thumb {
      width: 32px !important;
      height: 32px !important;
      object-fit: cover !important;
      border-radius: 0.4vh !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
      opacity: 0.45 !important;
      border: 1.5px solid transparent !important;
      transition: all 0.2s ease !important;
    }

    .wim_thumb:hover {
      opacity: 0.8 !important;
      transform: scale(1.08) !important;
    }

    .wim_thumb.active {
      opacity: 1 !important;
      border-color: rgba(255, 255, 255, 0.95) !important;
      transform: scale(1.12) !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35) !important;
    }

    .wim_body.wim_solo .wim_prev,
    .wim_body.wim_solo .wim_next,
    .wim_body.wim_solo .wim_counter,
    .wim_body.wim_solo .wim_strip {
      display: none !important;
    }

    .wi_img_clickable {
      cursor: zoom-in !important;
    }

    .wi_img_clickable:hover {
      transform: scale(1.012) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14) !important;
    }

    @media (max-width: 768px) {
      #wi_img_modal .modalBody.wim_body { max-width: 98vw !important; border-radius: 1.5vh !important; }
      .wim_img_wrap { padding: 1.5vh 5vh !important; }
      .wim_caption_row { bottom: 6.5vh !important; max-width: 90% !important; }
      .wim_strip { bottom: 1.5vh !important; max-width: 95% !important; }
      .wim_thumb { width: 28px !important; height: 28px !important; }
      .wim_prev, .wim_next { width: 3.8vh !important; height: 3.8vh !important; min-width: 32px !important; min-height: 32px !important; }
      .wim_prev { left: 1.2vh !important; }
      .wim_next { right: 1.2vh !important; }
    }
  `;
  document.head.appendChild(style);
}

// Variables del estado
let _built = false;
let _modal = null;
let _imgEl = null;
let _captionEl = null;
let _counterEl = null;
let _stripEl = null;

let _galeria = [];
let _idx = 0;
let _zoomLevel = 1;

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 0.25;

let _isDragging = false;
let _dragStartX = 0;
let _dragStartY = 0;
let _panX = 0;
let _panY = 0;
let _touchStartX = 0;

function updateTransform() {
  if (Math.abs(_zoomLevel - 1) > 0.02) {
    _imgEl.style.transform = `scale(${_zoomLevel.toFixed(2)}) translate(${(_panX / _zoomLevel).toFixed(1)}px, ${(_panY / _zoomLevel).toFixed(1)}px)`;
  } else {
    _imgEl.style.transform = '';
  }
}

function applyZoom(level) {
  _zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level));
  _imgEl.classList.toggle('wim_zoomed', Math.abs(_zoomLevel - 1) > 0.02);
  if (Math.abs(_zoomLevel - 1) <= 0.02) {
    _panX = 0;
    _panY = 0;
  }
  updateTransform();
}

function resetZoom() {
  _zoomLevel = 1;
  _panX = 0;
  _panY = 0;
  if (_imgEl) {
    _imgEl.classList.remove('wim_zoomed');
    _imgEl.style.transform = '';
  }
}

function buildStrip() {
  if (!_stripEl) return;
  _stripEl.innerHTML = '';
  _galeria.forEach((item, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'wim_thumb';
    thumb.src = item.src;
    thumb.alt = item.alt;
    thumb.dataset.idx = String(i);
    thumb.addEventListener('click', (e) => {
      e.stopPropagation();
      gotoImage(i);
    });
    _stripEl.appendChild(thumb);
  });
}

function gotoImage(idx) {
  const total = _galeria.length;
  if (total === 0) return;
  _idx = ((idx % total) + total) % total;
  resetZoom();

  _imgEl.style.opacity = '0';
  setTimeout(() => {
    const item = _galeria[_idx];
    if (item && _imgEl) {
      _imgEl.src = item.src;
      _imgEl.alt = item.alt;
      _captionEl.textContent = item.alt || '';
      _counterEl.textContent = total > 1 ? `${_idx + 1} / ${total}` : '';
      _imgEl.style.opacity = '1';
    }
  }, 110);

  if (_stripEl) {
    _stripEl.querySelectorAll('.wim_thumb').forEach((t, i) => t.classList.toggle('active', i === _idx));
    const active = _stripEl.querySelector('.wim_thumb.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }
}

function buildModal() {
  if (_built) return;
  _built = true;

  injectStyles();

  _modal = document.createElement('div');
  _modal.id = 'wi_img_modal';
  _modal.className = 'wiModal';
  _modal.innerHTML = `
    <div class="modalBody wim_body">
      <button class="wim_close modalX" aria-label="Cerrar galería"><i class="fas fa-xmark"></i></button>
      <div class="wim_stage">
        <button class="wim_prev" aria-label="Imagen anterior"><i class="fas fa-chevron-left"></i></button>
        <div class="wim_img_wrap">
          <img class="wim_img" src="" alt="" draggable="false" />
        </div>
        <button class="wim_next" aria-label="Imagen siguiente"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="wim_caption_row">
        <p class="wim_caption"></p>
        <span class="wim_counter"></span>
      </div>
      <div class="wim_strip"></div>
    </div>
  `;
  document.body.appendChild(_modal);

  _imgEl = _modal.querySelector('.wim_img');
  _captionEl = _modal.querySelector('.wim_caption');
  _counterEl = _modal.querySelector('.wim_counter');
  _stripEl = _modal.querySelector('.wim_strip');

  // Flechas
  _modal.querySelector('.wim_prev').addEventListener('click', (e) => {
    e.stopPropagation();
    gotoImage(_idx - 1);
  });
  _modal.querySelector('.wim_next').addEventListener('click', (e) => {
    e.stopPropagation();
    gotoImage(_idx + 1);
  });

  // Pan dragging
  let dragThresholdPassed = false;

  _imgEl.addEventListener('mousedown', (e) => {
    if (Math.abs(_zoomLevel - 1) <= 0.02) return;
    e.preventDefault();
    _isDragging = true;
    dragThresholdPassed = false;
    _dragStartX = e.clientX - _panX;
    _dragStartY = e.clientY - _panY;
    _imgEl.classList.add('wim_dragging');
  });

  _modal.addEventListener('mousemove', (e) => {
    if (!_isDragging) return;
    e.preventDefault();
    const nx = e.clientX - _dragStartX;
    const ny = e.clientY - _dragStartY;
    if (Math.abs(nx - _panX) > 4 || Math.abs(ny - _panY) > 4) {
      dragThresholdPassed = true;
    }
    _panX = nx;
    _panY = ny;
    updateTransform();
  });

  const stopDrag = () => {
    if (!_isDragging) return;
    _isDragging = false;
    _imgEl.classList.remove('wim_dragging');
  };

  _modal.addEventListener('mouseup', stopDrag);
  _modal.addEventListener('mouseleave', stopDrag);

  // Soporte móvil táctil para arrastre
  _imgEl.addEventListener('touchstart', (e) => {
    if (Math.abs(_zoomLevel - 1) <= 0.02) return;
    _isDragging = true;
    dragThresholdPassed = false;
    _dragStartX = e.touches[0].clientX - _panX;
    _dragStartY = e.touches[0].clientY - _panY;
    _imgEl.classList.add('wim_dragging');
  }, { passive: true });

  _imgEl.addEventListener('touchmove', (e) => {
    if (!_isDragging) return;
    const nx = e.touches[0].clientX - _dragStartX;
    const ny = e.touches[0].clientY - _dragStartY;
    if (Math.abs(nx - _panX) > 4 || Math.abs(ny - _panY) > 4) {
      dragThresholdPassed = true;
    }
    _panX = nx;
    _panY = ny;
    updateTransform();
  }, { passive: true });

  _imgEl.addEventListener('touchend', stopDrag, { passive: true });

  // Click zoom rápido
  _imgEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragThresholdPassed) return;
    if (Math.abs(_zoomLevel - 1) > 0.02) {
      resetZoom();
    } else {
      applyZoom(1.8);
    }
  });

  // Mouse wheel zoom
  window.addEventListener('wheel', (e) => {
    if (!_modal || !_modal.classList.contains('active')) return;
    const stage = _modal.querySelector('.wim_stage');
    if (!stage || !stage.contains(e.target)) return;
    e.preventDefault();
    applyZoom(_zoomLevel + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }, { passive: false });

  // Key listeners
  document.addEventListener('keydown', (e) => {
    if (!_modal || !_modal.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') {
      gotoImage(_idx - 1);
    } else if (e.key === 'ArrowRight') {
      gotoImage(_idx + 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      applyZoom(_zoomLevel + ZOOM_STEP);
    } else if (e.key === '-') {
      e.preventDefault();
      applyZoom(_zoomLevel - ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  });

  // Swipe táctil para pasar fotos en móvil
  const stage = _modal.querySelector('.wim_stage');
  stage.addEventListener('touchstart', (e) => {
    if (Math.abs(_zoomLevel - 1) > 0.02) return;
    _touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (Math.abs(_zoomLevel - 1) > 0.02) return;
    const dx = e.changedTouches[0].clientX - _touchStartX;
    if (Math.abs(dx) > 55) {
      gotoImage(dx < 0 ? _idx + 1 : _idx - 1);
    }
  });

  // Mutación Observer para capturar el cierre del modal desde modales.js
  const obs = new MutationObserver(() => {
    if (!_modal.classList.contains('active')) {
      resetZoom();
    }
  });
  obs.observe(_modal, { attributes: true, attributeFilter: ['class'] });
}

export function abrirGaleria(clickedImg, selector, altFallback) {
  buildModal();

  _galeria = [];
  const images = Array.from(document.querySelectorAll(selector))
    .filter(img => {
      return !img.classList.contains('cr_chat_header_avatar') && 
             !img.classList.contains('cr_typing_dot') && 
             img.offsetParent !== null;
    });

  images.forEach(img => {
    const src = img.src || img.dataset.src || '';
    if (src) {
      _galeria.push({
        src,
        alt: img.alt || img.getAttribute('title') || altFallback
      });
    }
  });

  const startIdx = images.indexOf(clickedImg);
  _idx = startIdx >= 0 ? startIdx : 0;

  _modal.querySelector('.wim_body').classList.toggle('wim_solo', _galeria.length <= 1);
  buildStrip();
  gotoImage(_idx);
  abrirModal('wi_img_modal');
}

/**
 * Registra clics y monta la galería en imágenes con selectores dinámicos.
 * 
 * @param {string} selector - Selector CSS para identificar las imágenes de la galería.
 * @param {Object} opts
 * @param {string} opts.altFallback - Alt por defecto si la imagen no tiene alt.
 */
export function wiGaleria(selector, opts = {}) {
  const { altFallback = 'Imagen' } = opts;

  const marcarCliqueables = () => {
    document.querySelectorAll(selector).forEach(img => {
      if (!img.classList.contains('cr_chat_header_avatar') && !img.classList.contains('wi_img_clickable')) {
        img.classList.add('wi_img_clickable');
      }
    });
  };

  marcarCliqueables();

  // Escucha delegada en clics
  const clickHandler = (e) => {
    const img = e.target.closest(selector);
    if (img && !img.classList.contains('cr_chat_header_avatar') && !img.classList.contains('cr_typing_dot')) {
      e.preventDefault();
      abrirGaleria(img, selector, altFallback);
    }
  };

  document.addEventListener('click', clickHandler);

  // Escuchar mutaciones dinámicas para marcar nuevas imágenes como cliqueables
  const obs = new MutationObserver(() => marcarCliqueables());
  obs.observe(document.body, { childList: true, subtree: true });

  return {
    destroy: () => {
      document.removeEventListener('click', clickHandler);
      obs.disconnect();
    }
  };
}

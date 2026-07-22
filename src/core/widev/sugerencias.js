// src/core/widev/sugerencias.js
// wiSugerencias v1.0 — Autocompletado combobox premium, con teclado, glassmorphism e inyección de estilos automática

// Inyectar estilos CSS para el panel de sugerencias automáticamente
if (typeof document !== 'undefined') {
  let style = document.getElementById('wi-sugerencias-injected-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wi-sugerencias-injected-styles';
    document.head.appendChild(style);
  }
  style.textContent = `
    .wi-sugerencias-panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 100%;
      z-index: 10000;
      background: var(--bg4);
      border: 1px solid var(--brd);
      border-radius: 0.8vh;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow-x: hidden;
      overflow-y: auto;
      opacity: 0;
      transform: translateY(-5px) scale(0.98);
      transform-origin: top center;
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: none;
      box-sizing: border-box;
      max-height: 25vh;
    }

    .wi-sugerencias-panel.wi-sugerencias-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .wi-sugerencias-list {
      list-style: none;
      margin: 0;
      padding: 0.6vh 0;
      padding-left: 0;
      padding-inline-start: 0;
    }

    .wi-sugerencias-item {
      padding: 1vh 1.4vh;
      font-size: var(--fz_s4);
      color: var(--tx1);
      cursor: pointer;
      font-family: var(--ff_P);
      transition: background var(--tr_f), color var(--tr_f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wi-sugerencias-item:hover,
    .wi-sugerencias-item.wi-sugerencias-cursor {
      background: var(--bg4);
      color: var(--mco);
    }

    .wi-sugerencias-item.wi-sugerencias-selected {
      background: var(--bg5);
      color: var(--mco);
      font-weight: 700;
    }
  `;
}

/**
 * Vincula sugerencias inteligentes e interactivas de escritura libre a un input text.
 * 
 * @param {HTMLInputElement|string} target Selector CSS o elemento Input
 * @param {Object} opts Opciones de configuración
 * @param {Array|Function} opts.sugerencias Lista de sugerencias (array de strings) o función que retorna el array
 * @param {number} opts.maxResultados Cantidad máxima de sugerencias a renderizar (por defecto 6)
 * @param {Function} opts.onSelect Callback ejecutado al elegir una sugerencia (value) => void
 * @returns {{ destroy, updateSugerencias }}
 */
export function wiSugerencias(target, opts = {}) {
  const input = typeof target === 'string' ? document.querySelector(target) : target;
  if (!input || input.tagName !== 'INPUT' || input.dataset.wisugerencias) return null;

  const {
    sugerencias = [],
    maxResultados = 6,
    onSelect = null
  } = opts;

  input.dataset.wisugerencias = 'true';
  input.setAttribute('autocomplete', 'off');

  // Asegurar que el contenedor padre tenga posicionamiento relativo para alinear el panel absoluto
  const parent = input.parentElement;
  if (parent && window.getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  // ── Elementos DOM ───────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'wi-sugerencias-panel';
  panel.setAttribute('role', 'listbox');

  const listContainer = document.createElement('ul');
  listContainer.className = 'wi-sugerencias-list';
  panel.appendChild(listContainer);
  
  input.insertAdjacentElement('afterend', panel);

  // ── Variables de Estado ──────────────────────────────────────────────────
  let isOpen = false;
  let curIdx = -1;
  let filteredItems = [];
  let listaSugerenciasActual = typeof sugerencias === 'function' ? sugerencias() : sugerencias;

  // ── Funciones de Actualización ──────────────────────────────────────────
  const obtenerSugerenciasActuales = () => {
    return typeof sugerencias === 'function' ? sugerencias() : listaSugerenciasActual;
  };

  const filtrarYRenderizar = () => {
    const query = input.value.trim().toLowerCase();
    const todas = obtenerSugerenciasActuales();
    
    // Si el campo está vacío, sugerir los primeros maxResultados por defecto
    const filtradas = query
      ? todas.filter(item => item.toLowerCase().includes(query))
      : todas;

    filteredItems = filtradas.slice(0, maxResultados);
    curIdx = -1;

    if (filteredItems.length === 0) {
      cerrar();
      return;
    }

    listContainer.innerHTML = filteredItems.map((item, i) => `
      <li class="wi-sugerencias-item" role="option" data-i="${i}" data-val="${item}">
        ${item}
      </li>
    `).join('');

    listContainer.querySelectorAll('.wi-sugerencias-item').forEach(li => {
      li.addEventListener('mouseenter', () => {
        curIdx = +li.dataset.i;
        marcarCursor();
      });
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        elegir(filteredItems[+li.dataset.i]);
      });
    });

    abrir();
  };

  // ── Acciones de Interfaz ─────────────────────────────────────────────────
  const abrir = () => {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add('wi-sugerencias-visible');
    document.addEventListener('click', cerrarAlClickFuera);
  };

  const cerrar = () => {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('wi-sugerencias-visible');
    document.removeEventListener('click', cerrarAlClickFuera);
  };

  const elegir = (value) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    onSelect?.(value);
    cerrar();
  };

  const marcarCursor = () => {
    listContainer.querySelectorAll('.wi-sugerencias-item').forEach((li, i) => {
      li.classList.toggle('wi-sugerencias-cursor', i === curIdx);
    });
    const selectedItem = listContainer.querySelectorAll('.wi-sugerencias-item')[curIdx];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  };

  const cerrarAlClickFuera = (e) => {
    if (!panel.contains(e.target) && !input.contains(e.target)) {
      cerrar();
    }
  };

  // ── Eventos de Teclado y Foco ──────────────────────────────────────────
  const manejarTeclado = (e) => {
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        filtrarYRenderizar();
      }
      return;
    }

    const total = filteredItems.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      curIdx = (curIdx + 1) % total;
      marcarCursor();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      curIdx = (curIdx - 1 + total) % total;
      marcarCursor();
    } else if (e.key === 'Enter') {
      if (curIdx >= 0 && curIdx < total) {
        e.preventDefault();
        elegir(filteredItems[curIdx]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
    }
  };

  // Enlazar listeners al input
  input.addEventListener('focus', filtrarYRenderizar);
  input.addEventListener('input', filtrarYRenderizar);
  input.addEventListener('keydown', manejarTeclado);

  // ── API pública ────────────────────────────────────────────────────────
  return {
    updateSugerencias: (nuevas) => {
      listaSugerenciasActual = nuevas;
    },
    destroy: () => {
      cerrar();
      panel.remove();
      delete input.dataset.wisugerencias;
      input.removeEventListener('focus', filtrarYRenderizar);
      input.removeEventListener('input', filtrarYRenderizar);
      input.removeEventListener('keydown', manejarTeclado);
    }
  };
}

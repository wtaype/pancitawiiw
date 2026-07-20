// src/core/widev/wiselect.js
// wiSelect v2.0 — Select premium con búsqueda en tiempo real, teclado, glassmorphism e inyección automática de estilos

// Inyección automática de estilos CSS de wiSelect en el DOM
if (typeof document !== 'undefined') {
  let style = document.getElementById('wi-select-injected-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wi-select-injected-styles';
    document.head.appendChild(style);
  }
  style.textContent = `
    /* ── Trigger visible (reemplaza el select nativo) ─────────────────────── */
    .wi-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 0 1.2vh;
      height: 4.2vh;
      min-height: 34px;
      background: var(--inp);
      border: 1px solid var(--brd);
      border-radius: 0.6vh;
      cursor: pointer;
      transition: border-color var(--tr_f), box-shadow var(--tr_f);
      user-select: none;
      outline: none;
      position: relative;
    }

    .wi-select-trigger:hover {
      border-color: var(--mco);
    }

    .wi-select-trigger:focus-visible {
      border-color: var(--mco);
      box-shadow: 0 0 0 3px var(--bg4);
    }

    .wi-select-trigger.wi-select-open {
      border-color: var(--mco);
      box-shadow: 0 0 0 3px var(--bg4);
    }

    .wi-select-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--fz_m);
      color: var(--tx);
      font-family: var(--ff_P);
    }

    .wi-select-placeholder {
      color: var(--tx3);
    }

    .wi-select-arrow {
      font-size: 10px;
      color: var(--tx3);
      transition: transform var(--tr_f), color var(--tr_f);
      flex-shrink: 0;
    }

    .wi-select-trigger.wi-select-open .wi-select-arrow {
      transform: rotate(180deg);
      color: var(--mco);
    }

    /* ── Panel flotante ────────────────────────────────────────────────────── */
    .wi-select-panel {
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
      width: 100%;
      z-index: 9999;
      background: var(--bg4);
      border: 1px solid var(--brd);
      border-radius: 1.2vh;
      box-shadow: 0 12px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow: hidden;
      opacity: 0;
      transform: translateY(-6px) scale(0.98);
      transform-origin: top center;
      transition: opacity 0.18s ease, transform 0.18s ease;
      pointer-events: none;
      min-width: 220px;
    }

    .wi-select-panel.wi-select-panel-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .wi-select-panel.wi-select-panel-up {
      transform-origin: bottom center;
    }

    /* ── Campo de búsqueda — icono absolute, sin outline ─────────────────── */
    .wi-select-search-wrapper {
      position: relative;
      border-bottom: 1px solid var(--brd);
      background: var(--bg4);
    }

    .wi-select-search-icon {
      position: absolute !important;
      left: 14px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: var(--tx3) !important;
      font-size: 11px !important;
      pointer-events: none !important;
      transition: color var(--tr_f) !important;
      z-index: 1 !important;
    }

    .wi-select-search-wrapper:focus-within .wi-select-search-icon {
      color: var(--mco) !important;
    }

    .wi-select-search {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 1.2vh 1.5vh 1.2vh 38px !important;
      border: none !important;
      background: transparent !important;
      font-size: var(--fz_m) !important;
      color: var(--tx) !important;
      outline: none !important;
      font-family: var(--ff_P) !important;
      caret-color: var(--mco) !important;
    }

    .wi-select-search::placeholder {
      color: var(--tx3);
      opacity: 0.6;
    }

    /* ── Lista de opciones ─────────────────────────────────────────────────── */
    .wi-select-list {
      list-style: none;
      margin: 0;
      padding: 0.8vh 0;
      padding-left: 0;
      padding-inline-start: 0;
      overflow-y: auto;
      max-height: 25vh;
      scrollbar-width: thin;
      scrollbar-color: var(--mco) transparent;
    }

    .wi-select-option {
      padding: 1vh 1.5vh;
      font-size: var(--fz_m);
      color: var(--tx1);
      cursor: pointer;
      transition: background var(--tr_f), color var(--tr_f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--ff_P);
    }

    .wi-select-option:hover,
    .wi-select-option.wi-select-cursor {
      background: var(--bg4);
      color: var(--mco);
    }

    .wi-select-option.wi-select-selected {
      background: var(--bg5);
      color: var(--mco);
      font-weight: 700;
    }

    /* ── Sin resultados ────────────────────────────────────────────────────── */
    .wi-select-empty {
      padding: 1.5vh;
      font-size: var(--fz_s4);
      color: var(--tx3);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Convierte un <select> nativo en un select premium con buscador.
 *
 * @param {string|HTMLElement} target  - Selector CSS o elemento <select>
 * @param {Object}             opts
 * @param {string}             opts.placeholder        - Texto vacío
 * @param {string}             opts.searchPlaceholder  - Placeholder del buscador
 * @param {Function}           opts.onChange           - Callback (value, label) => void
 * @returns {{ getValue, setValue, destroy }}
 */
export function wiSelect(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el || el.tagName !== 'SELECT' || el.dataset.wiselect) return null;

  const {
    placeholder       = 'Selecciona una opción...',
    searchPlaceholder = 'Buscar...',
    onChange          = null,
  } = opts;

  // Marcar y ocultar el select nativo
  el.dataset.wiselect = 'true';
  el.style.display = 'none';

  // ── Trigger ──────────────────────────────────────────────────────────
  const trigger = document.createElement('div');
  trigger.className = 'wi-select-trigger';
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const renderTrigger = (label) => {
    trigger.innerHTML = `
      <span class="wi-select-label ${label ? '' : 'wi-select-placeholder'}">${label || placeholder}</span>
      <i class="fa-solid fa-chevron-down wi-select-arrow"></i>
    `;
  };

  const getSelectedLabel = () => {
    const opt = el.options[el.selectedIndex];
    return opt?.value ? opt.text : '';
  };

  renderTrigger(getSelectedLabel());
  el.insertAdjacentElement('afterend', trigger);

  // ── Estado ────────────────────────────────────────────────────────────
  let panel    = null;
  let isOpen   = false;
  let curIdx   = -1;
  let filtered = [];

  // ── Abrir ─────────────────────────────────────────────────────────────
  const abrir = () => {
    if (isOpen) return;
    isOpen = true;

    // Cerrar cualquier otro abierto
    document.querySelectorAll('.wi-select-trigger.wi-select-open').forEach(t => {
      if (t !== trigger) t.click();
    });

    trigger.classList.add('wi-select-open');
    trigger.setAttribute('aria-expanded', 'true');

    const opciones = leerOpciones();
    filtered = opciones;
    curIdx   = -1;

    // Crear panel
    panel = document.createElement('div');
    panel.className = 'wi-select-panel';
    panel.setAttribute('role', 'listbox');

    // Evitar que clics dentro del panel cierren el selector por propagación al trigger
    panel.addEventListener('click', (e) => e.stopPropagation());

    // Buscador con icono absolute
    panel.innerHTML = `
      <div class="wi-select-search-wrapper">
        <i class="fa-solid fa-magnifying-glass wi-select-search-icon"></i>
        <input class="wi-select-search" type="text" placeholder="${searchPlaceholder}" autocomplete="off" spellcheck="false" />
      </div>
      <ul class="wi-select-list" role="listbox"></ul>
    `;

    trigger.appendChild(panel);

    const searchEl = panel.querySelector('.wi-select-search');
    const lista    = panel.querySelector('.wi-select-list');

    const renderLista = (items) => {
      filtered = items;
      curIdx   = -1;
      lista.innerHTML = items.length
        ? items.map((item, i) => `
            <li class="wi-select-option${item.value === el.value ? ' wi-select-selected' : ''}"
                role="option" data-i="${i}" data-val="${item.value}">${item.label}</li>
          `).join('')
        : `<li class="wi-select-empty"><i class="fa-solid fa-face-frown-open"></i> Sin resultados</li>`;

      lista.querySelectorAll('.wi-select-option').forEach(li => {
        li.addEventListener('mouseenter', () => { curIdx = +li.dataset.i; marcarCursor(); });
        li.addEventListener('click', (e) => { e.stopPropagation(); elegir(filtered[+li.dataset.i]); });
      });
    };

    renderLista(opciones);

    // Animar apertura en el siguiente frame
    requestAnimationFrame(() => panel.classList.add('wi-select-panel-visible'));

    // Foco en buscador
    setTimeout(() => searchEl.focus(), 40);

    // Filtrar
    searchEl.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      renderLista(q ? opciones.filter(o => o.label.toLowerCase().includes(q)) : opciones);
    });

    searchEl.addEventListener('keydown', manejarTecla);

    // Cerrar al click fuera
    setTimeout(() => document.addEventListener('click', cerrarAlFuera), 0);
  };

  // ── Cerrar ────────────────────────────────────────────────────────────
  const cerrar = () => {
    if (!isOpen) return;
    isOpen = false;
    trigger.classList.remove('wi-select-open');
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', cerrarAlFuera);

    if (panel) {
      panel.classList.remove('wi-select-panel-visible');
      const p = panel;
      panel = null;
      setTimeout(() => p.remove(), 200);
    }
  };

  const cerrarAlFuera = (e) => {
    if (!panel?.contains(e.target) && !trigger.contains(e.target)) cerrar();
  };

  // ── Elegir opción ──────────────────────────────────────────────────────
  const elegir = (item) => {
    if (!item) return;
    el.value = item.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    renderTrigger(item.label);
    onChange?.(item.value, item.label);
    cerrar();
  };

  // ── Cursor de teclado ─────────────────────────────────────────────────
  const marcarCursor = () => {
    panel?.querySelectorAll('.wi-select-option').forEach((li, i) =>
      li.classList.toggle('wi-select-cursor', i === curIdx)
    );
    panel?.querySelectorAll('.wi-select-option')[curIdx]?.scrollIntoView({ block: 'nearest' });
  };

  // ── Teclado ────────────────────────────────────────────────────────────
  const manejarTecla = (e) => {
    if (!isOpen) return;
    const items = panel?.querySelectorAll('.wi-select-option') || [];
    if (e.key === 'ArrowDown')  { e.preventDefault(); curIdx = Math.min(curIdx + 1, items.length - 1); marcarCursor(); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); curIdx = Math.max(curIdx - 1, 0); marcarCursor(); }
    else if (e.key === 'Enter' && curIdx >= 0) { e.preventDefault(); elegir(filtered[curIdx]); }
    else if (e.key === 'Escape') { cerrar(); trigger.focus(); }
  };



  // ── Leer opciones del <select> ─────────────────────────────────────────
  const leerOpciones = () =>
    [...el.options].filter(o => o.value !== '').map(o => ({ value: o.value, label: o.text }));

  // ── Eventos del trigger ────────────────────────────────────────────────
  trigger.addEventListener('click', (e) => { e.stopPropagation(); isOpen ? cerrar() : abrir(); });
  trigger.addEventListener('keydown', (e) => {
    if ([' ', 'Enter', 'ArrowDown'].includes(e.key)) { e.preventDefault(); abrir(); }
  });

  // ── API pública ────────────────────────────────────────────────────────
  return {
    getValue: () => el.value,
    setValue: (val) => {
      const opt = [...el.options].find(o => o.value === val);
      if (opt) { el.value = val; renderTrigger(opt.text); onChange?.(val, opt.text); }
    },
    destroy: () => {
      cerrar();
      trigger.remove();
      el.style.display = '';
      delete el.dataset.wiselect;
    },
  };
}

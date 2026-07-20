// src/lib/widev/mensajes.js
// mensajes v1.0: Módulo unificado de mensajes UI — Toasts (Mensaje) + Banners apilables (Notificacion)
// CSS centralizado aquí en una sola inyección para toda la app

import { wiInit } from './wiinit.js';

// ── Helper XSS: convierte texto en contenido seguro para innerHTML ───────────
const _safe = (txt) => {
  if (typeof document === 'undefined') return String(txt ?? '');
  
  try {
    const doc = new DOMParser().parseFromString(txt, 'text/html');
    const permitidos = ['i', 'b', 'strong', 'em', 'span', 'br'];

    const limpiar = (node) => {
      if (node.nodeType === 1) { // Nodo elemento
        const tag = node.tagName.toLowerCase();
        
        if (!permitidos.includes(tag)) {
          // Si no está permitido, lo neutralizamos convirtiéndolo a texto plano
          const textNode = document.createTextNode(node.outerHTML);
          node.parentNode?.replaceChild(textNode, node);
        } else {
          // Si está permitido, eliminamos atributos peligrosos (eventos on*, javascript: urls)
          [...node.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const val = attr.value.toLowerCase();
            if (name.startsWith('on') || val.includes('javascript:')) {
              node.removeAttribute(attr.name);
            }
          });
          
          // Limpiar nodos hijos recursivamente
          let child = node.firstChild;
          while (child) {
            const next = child.nextSibling;
            limpiar(child);
            child = next;
          }
        }
      }
    };

    let child = doc.body.firstChild;
    while (child) {
      const next = child.nextSibling;
      limpiar(child);
      child = next;
    }

    return doc.body.innerHTML;
  } catch (e) {
    // Fallback básico ante cualquier error
    const el = document.createElement('div');
    el.textContent = String(txt ?? '');
    return el.innerHTML;
  }
};

// ── Iconos por tipo de alerta ────────────────────────────────────────────────
const _ico = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info'
};

// ── Inyección del CSS de feedback (verifica el DOM para ser compatible con Astro ClientRouter) ──
const _inyectarCSS = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('widev-feedback-css')) return;

  const s = document.createElement('style');
  s.id = 'widev-feedback-css';
  s.setAttribute('data-astro-transition-persist', 'widev-feedback-css');
  s.textContent = `
    /* ── TOASTS centrados (Mensaje) ──────────────────────────────────── */
    .widev-toast {
      position: fixed;
      top: 3vh;
      left: 50%;
      transform: translate(-50%, -2vh);
      padding: 1.6vh 2.5vh;
      border-radius: 1vh;
      background: var(--bg3, #ffffff);
      color: var(--tx1, #212529);
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.15);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 1.5vh;
      min-width: 320px;
      max-width: 90%;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1);
      backdrop-filter: blur(12px);
      pointer-events: auto;
    }
    .widev-toast.active {
      opacity: 1;
      transform: translate(-50%, 0);
    }

    /* ── BANNERS apilables laterales (Notificacion) ──────────────────── */
    #notificationsContainer {
      position: fixed;
      top: 3vh;
      right: 3vh;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 1.5vh;
      max-width: 380px;
      width: 90%;
      pointer-events: none;
    }
    .notification {
      background: var(--bg3, #ffffff);
      color: var(--tx1, #212529);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
      border-radius: 1vh;
      padding: 2vh 2.5vh;
      display: flex;
      align-items: center;
      gap: 1.5vh;
      opacity: 0;
      transform: translateX(4vh);
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
      backdrop-filter: blur(8px);
      pointer-events: auto;
    }
    .notification.active {
      opacity: 1;
      transform: translateX(0);
    }

    /* ── Colores compartidos (toasts + banners) ──────────────────────── */
    .widev-toast--success, .notif-success { border-left: 5px solid var(--success, #10b981); }
    .widev-toast--error,   .notif-error   { border-left: 5px solid var(--error,   #ef4444); }
    .widev-toast--warning, .notif-warning { border-left: 5px solid var(--warning, #f59e0b); }
    .widev-toast--info,    .notif-info    { border-left: 5px solid var(--info,    #3b82f6); }

    .widev-toast i, .notification i { font-size: var(--fz_m1, 1.25rem); }

    .widev-toast--success i, .notif-success i { color: var(--success, #10b981); }
    .widev-toast--error   i, .notif-error   i { color: var(--error,   #ef4444); }
    .widev-toast--warning i, .notif-warning i { color: var(--warning, #f59e0b); }
    .widev-toast--info    i, .notif-info    i { color: var(--info,    #3b82f6); }

    .widev-toast span, .notification span {
      flex: 1;
      font-size: var(--fz_m);
      font-weight: 500;
      color: var(--tx1);
    }
    .notification button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--tx2, #6c757d);
      transition: color 0.2s;
      line-height: 1;
      padding: 0;
      margin-left: 1vh;
    }
    .notification button:hover { color: var(--tx1, #212529); }
  `;
  document.head.appendChild(s);
};

// ── TOAST flotante centrado ──────────────────────────────────────────────────
export function Mensaje(msg, tipo = 'success') {
  if (typeof document === 'undefined') return;
  _inyectarCSS();

  // Eliminar toasts previos para no colapsar la pantalla
  document.querySelectorAll('.widev-toast').forEach(el => el.remove());

  const icon = document.createElement('i');
  icon.className = `fa-solid ${_ico[tipo] ?? 'fa-circle-info'}`;

  const span = document.createElement('span');
  span.innerHTML = _safe(msg);

  const toast = document.createElement('div');
  toast.className = `widev-toast widev-toast--${tipo}`;
  toast.append(icon, span);
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('active'));
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── BANNER apilable lateral ──────────────────────────────────────────────────
export function Notificacion(msg, tipo = 'error', tiempo = 3000) {
  if (typeof document === 'undefined') return;
  _inyectarCSS();

  // Obtener o crear el contenedor apilador
  let container = document.getElementById('notificationsContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationsContainer';
    document.body.appendChild(container);
  }

  const icon = document.createElement('i');
  icon.className = `fa-solid ${_ico[tipo] ?? 'fa-circle-info'}`;

  const span = document.createElement('span');
  span.innerHTML = _safe(msg);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';

  const notif = document.createElement('div');
  notif.className = `notification notif-${tipo}`;
  notif.append(icon, span, closeBtn);
  container.appendChild(notif);

  // Animar entrada con RAF para garantizar la transición CSS
  requestAnimationFrame(() => notif.classList.add('active'));

  const cerrar = () => {
    notif.classList.remove('active');
    notif.style.transform = 'translateX(4vh)';
    setTimeout(() => notif.remove(), 350);
  };

  closeBtn.addEventListener('click', cerrar);
  setTimeout(cerrar, tiempo);
}

// src/core/widev/witip.js
// wiTip v11.4: Tooltip flotante con eliminación instantánea al hacer clic, salir del área o cambiar de foco

import { wiInit } from './wiinit.js';

let activeTarget = null;
let hideTimeout = null;

export function wiTip(elmOrTxt, txt, tipo = 'top', tiempo = 1800) {
  if (typeof document === 'undefined') return;

  // 1. Inyectar estilos persistentes si no existen en el DOM
  if (!document.getElementById('wiTip-css')) {
    const style = document.createElement('style');
    style.id = 'wiTip-css';
    style.setAttribute('data-astro-transition-persist', 'wiTip-css');
    style.textContent = `
      /* Estilos para Tooltips dinámicos JS */
      .wiTip {
        position: fixed;
        color: var(--txa);
        z-index: 99999;
        padding: .8vh 1.2vh;
        border-radius: .6vh;
        font-size: var(--fz_s4);
        font-weight: 500;
        max-width: 25vh;
        box-shadow: 0 .4vh 1.2vh rgba(0,0,0,.2);
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.15s, transform 0.15s;
        pointer-events: none;
        backdrop-filter: blur(.4vh);
        white-space: nowrap;
      }
      .wiTip.show { opacity: 1; transform: scale(1); }
      .wiTip::after {
        content: "";
        position: absolute;
      }

      /* Posicionamiento y flechas de wiTip */
      .wiTip.tip-top::after {
        top: 100%;
        left: 50%;
        margin-left: -.6vh;
        border: .6vh solid transparent;
        border-top-color: inherit;
      }
      .wiTip.tip-bottom::after {
        bottom: 100%;
        left: 50%;
        margin-left: -.6vh;
        border: .6vh solid transparent;
        border-bottom-color: inherit;
      }
      .wiTip.tip-left::after {
        left: 100%;
        top: 50%;
        margin-top: -.6vh;
        border: .6vh solid transparent;
        border-left-color: inherit;
      }
      .wiTip.tip-right::after {
        right: 100%;
        top: 50%;
        margin-top: -.6vh;
        border: .6vh solid transparent;
        border-right-color: inherit;
      }

      /* Estilos para Tooltips 100% CSS (Sin JS) */
      [data-witip-css] {
        position: relative;
      }
      [data-witip-css]::after {
        content: attr(data-witip-css);
        position: absolute;
        bottom: 130%;
        left: 50%;
        transform: translateX(-50%) translateY(8px);
        background: var(--success, #10b981);
        color: var(--txa, #fff);
        padding: .8vh 1.4vh;
        border-radius: 1vh;
        font-size: var(--fz_s3, 0.75rem);
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        backdrop-filter: blur(4px);
      }
      [data-witip-css]::before {
        content: "";
        position: absolute;
        bottom: 115%;
        left: 50%;
        transform: translateX(-50%) translateY(8px);
        border: 6px solid transparent;
        border-top-color: var(--success, #10b981);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 9999;
      }
      [data-witip-css]:hover::after,
      [data-witip-css]:hover::before {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);

    // Delegación limpia de eventos en document
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest?.('[data-witip]');
      if (target) {
        clearTimeout(hideTimeout);
        if (activeTarget !== target) {
          activeTarget = target;
          wiTip.ver(target, target.getAttribute('data-witip') || '', target.getAttribute('data-wtipo') || 'top', 0);
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (activeTarget) {
        const related = e.relatedTarget;
        if (!related || !activeTarget.contains(related)) {
          hide();
        }
      }
    });

    // Ocultamiento inmediato al hacer clic en cualquier elemento de la pantalla
    document.addEventListener('click', () => {
      hide();
    });

    // Ocultamiento al desplazarse o perder el foco
    window.addEventListener('scroll', () => hide(), { passive: true });
    window.addEventListener('blur', () => hide());
  }

  if (!elmOrTxt) return;
  if (typeof elmOrTxt === 'string' && !txt) {
    return `data-witip="${elmOrTxt}" data-wtipo="${tipo}" data-wtiempo="${tiempo}"`;
  }
  return wiTip.ver(elmOrTxt, txt || '', tipo, tiempo), elmOrTxt;
}

const hide = () => {
  activeTarget = null;
  const tips = document.querySelectorAll('.wiTip');
  tips.forEach(t => {
    t.classList.remove('show');
    t.remove();
  });
  clearTimeout(hideTimeout);
};

wiTip.ocultar = hide;

wiTip.ver = (elm, txt, tipo, tiempo) => {
  const el = typeof elm === 'string' ? document.querySelector(elm) : elm;
  if (!el) return;

  hide();

  // Esquema de colores intacto
  const colorTheme = { success: 'var(--success)', error: 'var(--error)', warning: 'var(--warning)', info: 'var(--info)' }[tipo] || 'var(--mco)';
  
  // Posicionamiento espacial (top, bottom, left, right)
  const pos = ['top', 'bottom', 'left', 'right'].includes(tipo) ? tipo : 'top';

  const tip = document.createElement('div');
  tip.className = `wiTip tip-${pos}`;
  Object.assign(tip.style, {
    background: colorTheme,
    borderColor: colorTheme
  });
  tip.innerHTML = `<span>${txt}</span>`;
  document.body.appendChild(tip);

  const rect = el.getBoundingClientRect();
  const tipW = tip.offsetWidth;
  const tipH = tip.offsetHeight;

  let leftPos = rect.left + rect.width / 2 - tipW / 2;
  let topPos = rect.top - tipH - 8;

  if (pos === 'right') {
    leftPos = rect.right + 10;
    topPos = rect.top + rect.height / 2 - tipH / 2;
  } else if (pos === 'bottom') {
    leftPos = rect.left + rect.width / 2 - tipW / 2;
    topPos = rect.bottom + 8;
  } else if (pos === 'left') {
    leftPos = rect.left - tipW - 10;
    topPos = rect.top + rect.height / 2 - tipH / 2;
  }

  // Prevenir desbordamiento de pantalla
  leftPos = Math.max(8, Math.min(leftPos, window.innerWidth - tipW - 8));
  topPos = Math.max(8, Math.min(topPos, window.innerHeight - tipH - 8));

  Object.assign(tip.style, {
    left: `${leftPos}px`,
    top: `${topPos}px`
  });

  requestAnimationFrame(() => {
    tip.classList.add('show');
    if (tiempo > 0) {
      hideTimeout = setTimeout(() => {
        hide();
      }, tiempo);
    }
  });
};

// Auto-inicialización via wiInit
wiInit(() => wiTip());
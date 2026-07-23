// src/core/widev/witip.js
// wiTip v11.4: Tooltip flotante con eliminación instantánea al hacer clic, salir del área o cambiar de foco

import { wiInit } from './wiinit.js';

let activeTarget = null;
let hideTimeout = null;

export function wiTip(elmOrTxt, txt, tipo = 'top', tiempo = 1800) {
  if (typeof document === 'undefined') return;

  // Delegación limpia de eventos en document (estilos cargados estáticamente en witema.css)
  if (!document.__wiTipDelegated) {
    document.__wiTipDelegated = true;
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
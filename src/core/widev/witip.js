// src/lib/widev/witip.js
// wiTip v11.3: Tooltip flotante con inyección de estilos bajo demanda (Lazy Injection)

let activeTarget = null;
let activeTip = null;
let hideTimeout = null;

function asegurarEstilos() {
  if (typeof document === 'undefined' || document.getElementById('wiTip-css')) return;

  const style = document.createElement('style');
  style.id = 'wiTip-css';
  style.setAttribute('data-astro-transition-persist', 'wiTip-css');
  style.textContent = `
    /* Estilos para Tooltips dinámicos JS */
    .wiTip {
      position: fixed;
      color: var(--tx1);
      z-index: 99999;
      padding: .8vh 1.2vh;
      border-radius: .6vh;
      font-size: var(--fz_s4);
      font-weight: 500;
      max-width: 25vh;
      box-shadow: var(--bs_l);
      opacity: 0;
      transform: translateY(-.3vh);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: auto;
      backdrop-filter: blur(.4vh);
    }
    .wiTip.show { opacity: 1; transform: translateY(0); }
    .wiTip::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -.6vh;
      border: .6vh solid transparent;
      border-top-color: inherit;
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
      color: var(--tx1, #fff);
      padding: .8vh 1.4vh;
      border-radius: 1vh;
      font-size: var(--fz_s3, 0.75rem);
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--bs_l);
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

  // Delegar eventos una sola vez al inyectar los estilos
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
    const related = e.relatedTarget;
    const isOverTip = related?.closest?.('.wiTip');
    const isOverTarget = related && activeTarget && (activeTarget === related || activeTarget.contains(related));

    const target = e.target.closest?.('[data-witip]');
    if (target && !target.contains(related) && !isOverTip) {
      hide();
    }

    const tip = e.target.closest?.('.wiTip');
    if (tip && !tip.contains(related) && !isOverTarget) {
      hide();
    }
  });
}

export function wiTip(elmOrTxt, txt, tipo = 'top', tiempo = 1800) {
  if (typeof document === 'undefined') return;

  // Inyección de estilos y listeners bajo demanda al interactuar
  asegurarEstilos();

  if (!elmOrTxt) return;
  if (typeof elmOrTxt === 'string' && !txt) {
    return `data-witip="${elmOrTxt}" data-wtipo="${tipo}" data-wtiempo="${tiempo}"`;
  }
  return wiTip.ver(elmOrTxt, txt || '', tipo, tiempo), elmOrTxt;
}

const hide = () => {
  activeTarget = null;
  const tips = document.querySelectorAll('.wiTip');
  tips.forEach(t => t.classList.remove('show'));
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => tips.forEach(t => t.remove()), 200);
};

wiTip.ver = (elm, txt, tipo, tiempo) => {
  if (typeof document === 'undefined') return;
  asegurarEstilos();

  const el = typeof elm === 'string' ? document.querySelector(elm) : elm;
  if (!el) return;

  document.querySelectorAll('.wiTip').forEach(tip => tip.remove());
  
  const colorTheme = { success: 'var(--success)', error: 'var(--error)', warning: 'var(--warning)', info: 'var(--info)' }[tipo] || 'var(--mco)';
  const tip = document.createElement('div');
  tip.className = 'wiTip';
  Object.assign(tip.style, {
    background: colorTheme,
    borderTopColor: colorTheme
  });
  tip.innerHTML = `<span>${txt}</span>`;
  document.body.appendChild(tip);

  const rect = el.getBoundingClientRect();
  const tipW = tip.offsetWidth;
  const tipH = tip.offsetHeight;
  Object.assign(tip.style, {
    left: `${Math.max(8, Math.min(rect.left + rect.width / 2 - tipW / 2, window.innerWidth - tipW - 8))}px`,
    top: `${rect.top - tipH - 8}px`
  });

  requestAnimationFrame(() => {
    tip.classList.add('show');
    if (tiempo > 0) {
      setTimeout(() => {
        tip.classList.remove('show');
        setTimeout(() => tip.remove(), 200);
      }, tiempo);
    }
  });
};
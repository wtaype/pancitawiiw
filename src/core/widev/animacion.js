// src/lib/widev/animacion.js
// Funciones de animación e IntersectionObservers optimizadas para Astro ClientRouter

import { wiInit } from './wiinit.js';

// ── 1. wiVista v13.1: Observador de entrada general ──────────────────
export const wiVista = (sel, fn, { stagger = 0, anim = '', threshold = 0.1, once = true, root = null, onExit = null, delay = 0 } = {}) => {
  if (typeof document === 'undefined') return null;
  const els = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  if (!els.length) return null;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const idx = els.indexOf(e.target);
      if (e.isIntersecting) {
        setTimeout(() => {
          if (anim) e.target.classList.add('wi_visible');
          fn?.(e.target, idx);
        }, delay + stagger * idx);
        if (once) obs.unobserve(e.target);
      } else {
        onExit?.(e.target, idx);
      }
    });
  }, { rootMargin: '20px', threshold, root });

  els.forEach((el) => {
    if (anim) el.classList.add(anim);
    obs.observe(el);
  });
  return obs;
};

// ── 2. herowi v10.1: Animación de entrada escalonada para cabeceras ──────────────────
export const herowi = (sel = '[data-herowi]', defSt = 45) => {
  if (typeof document === 'undefined') return;

  // Garantizar estilos persistentes para la animación herowi
  if (!document.getElementById('hwi-css')) {
    const style = document.createElement('style');
    style.id = 'hwi-css';
    style.setAttribute('data-astro-transition-persist', 'hwi-css');
    style.textContent = `
      @keyframes hwi_fade {
        from { opacity: 0; transform: translateY(3vh); }
        to { opacity: 1; transform: translateY(0); }
      }
      .hwi { animation: hwi_fade 0.8s cubic-bezier(0.4, 0, 0.2, 1) backwards; }
    `;
    document.head.appendChild(style);
  }

  const nodes = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  nodes.forEach((t) => {
    const els = (t.hasAttribute('data-herowi') && t.children.length ? [...t.children] : [t]).filter((e) => !e.dataset.hi);
    if (els.length) {
      const st = parseInt(t.dataset.herowi) || defSt;
      els.forEach((e, i) => {
        e.style.animationDelay = `${Math.min(i * st, 800)}ms`;
        e.classList.add('hwi');
        e.dataset.hi = '1';
      });
    }
  });
};

// ── 3. showi v14.1: Animación al hacer scroll para listados ──────────────────
export const showi = (sel = '[data-showi]', dSt = 45) => {
  if (typeof document === 'undefined') return;

  // Garantizar estilos persistentes para la animación showi
  if (!document.getElementById('swi-css')) {
    const style = document.createElement('style');
    style.id = 'swi-css';
    style.setAttribute('data-astro-transition-persist', 'swi-css');
    style.textContent = `
      .swi { opacity: 0; transform: translateY(3vh); transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
    `;
    document.head.appendChild(style);
  }

  let n = 0;
  let timer;
  const obs = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      const t = e.target;
      obs.unobserve(t);
      setTimeout(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
        setTimeout(() => {
          t.classList.remove('swi');
          t.style.opacity = '';
          t.style.transform = '';
        }, 750);
      }, n++ * (parseInt(t.dataset.st || '') || dSt));
    });
    clearTimeout(timer);
    timer = setTimeout(() => { n = 0; }, 100);
  });

  const parents = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  parents.forEach((p) => {
    (p.hasAttribute('data-showi') && p.children.length ? [...p.children] : [p]).filter((e) => !e.dataset.i).forEach((e) => {
      e.dataset.i = '1';
      e.dataset.st = parseInt(p.dataset.showi || '') || dSt;
      e.classList.add('swi');
      obs.observe(e);
    });
  });
};

// ── 4. wiFade v12.1: Transición de opacidad suave para inserciones ──────────────────
export const wiFade = async (sel, html, dur = 50) => {
  if (typeof document === 'undefined') return;
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if (!el) return;

  el.style.willChange = 'opacity';
  el.style.transition = `opacity ${dur}ms ease`;
  el.style.opacity = '0';
  
  await new Promise((r) => setTimeout(r, dur));
  el.innerHTML = html;
  el.style.opacity = '1';
  
  await new Promise((r) => setTimeout(r, dur));
  el.style.transition = '';
  el.style.willChange = '';
};

// Auto-inicialización via wiInit (elimina triple listener duplicado)
wiInit(() => {
  herowi();
  showi();
});
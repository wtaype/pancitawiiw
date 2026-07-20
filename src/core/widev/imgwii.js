// src/lib/widev/imgwii.js
// imgwii v7.3: Carga diferida de imágenes con placeholder e inyección de efectos blur-up automáticos

import { wiInit } from './wiinit.js';

export const imgwii = (() => {
  let obs = null;

  const subirCSS = () => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('widev-imgwii-css')) return;

    const s = document.createElement('style');
    s.id = 'widev-imgwii-css';
    s.setAttribute('data-astro-transition-persist', 'widev-imgwii-css');
    s.textContent = `
      /* Efecto blur-up premium para carga de imágenes */
      .wi_skeleton {
        filter: blur(8px);
        transition: filter 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        will-change: filter;
      }
      .wi_skeleton.wi_loaded {
        filter: blur(0);
      }
      img[data-src] {
        opacity: 1;
      }
    `;
    document.head.appendChild(s);
  };

  const applyImg = (el) => {
    if (el.dataset.src) {
      el.src = el.dataset.src;
      delete el.dataset.src;
      const finish = () => {
        el.classList.remove('wi_skeleton');
        el.classList.add('wi_loaded', 'loaded');
      };
      if (el.complete) finish();
      else { el.onload = finish; el.onerror = finish; }
    } else if (el.dataset.bg) {
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
      el.classList.remove('wi_skeleton');
      delete el.dataset.bg;
    }
  };

  const getObserver = () => {
    if (!obs) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            obs.unobserve(e.target);
            applyImg(e.target);
          }
        });
      }, { rootMargin: '120px' });
    }
    return obs;
  };

  /** @param {string | HTMLElement | Document} [scopeOrEl] */
  const ver = (scopeOrEl = document) => {
    subirCSS();
    const scope = typeof scopeOrEl === 'string' ? document.querySelector(scopeOrEl) ?? document : scopeOrEl;
    const root = scope instanceof HTMLElement ? scope : document;

    const observer = getObserver();

    root.querySelectorAll('img[data-src]').forEach(el => {
      // Inyectar placeholder de public si no tiene uno
      if (!el.getAttribute('src')) {
        el.setAttribute('src', imgwii.svg);
      }
      el.classList.add('wi_skeleton');
      observer.observe(el);
    });

    root.querySelectorAll('[data-bg]').forEach(el => {
      el.classList.add('wi_skeleton');
      observer.observe(el);
    });
  };

  return {
    svg: "/wpuntos.svg", // Novedad: Usa el placeholder de la carpeta public/
    ver
  };
})();

// Auto-inicialización via wiInit (elimina triple listener duplicado)
wiInit(() => imgwii.ver());
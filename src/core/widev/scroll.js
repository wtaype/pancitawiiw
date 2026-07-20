// src/lib/widev/scroll.js
// scroll v10.2: Scroll Spy basado en IntersectionObserver con soporte para contenedores internos custom y SSR-safety

export const wiScroll = (ids, navSel, opts = {}) => {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return null;

  const { margin = '-20% 0px -70% 0px', cls = 'active', root = null } = opts;
  
  const obs = new IntersectionObserver(
    entries => {
      entries.filter(e => e.isIntersecting).forEach(e => {
        document.querySelectorAll(navSel).forEach(el => el.classList.remove(cls));
        const activeEl = document.querySelector(`${navSel}[href="#${e.target.id}"]`);
        if (activeEl) activeEl.classList.add(cls);
      });
    },
    { rootMargin: margin, root }
  );

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });

  return obs;
};
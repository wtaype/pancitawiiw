// src/features/chatwii/lib/scroll.js
// Lógica para control de auto-scroll inteligente y congelación al subir (Throttled)

export function crearScrollInteligente(areaEl) {
  if (!areaEl) return null;

  let usuarioEnElFondo = true;
  const UMBRAL_FONDO = 60; // px

  const verificarScroll = () => {
    const dFondo = areaEl.scrollHeight - areaEl.scrollTop - areaEl.clientHeight;
    usuarioEnElFondo = dFondo <= UMBRAL_FONDO;
  };

  areaEl.addEventListener('scroll', verificarScroll);

  let frameId = null;

  const autoScroll = (forzar = false) => {
    if (forzar || usuarioEnElFondo) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        areaEl.scrollTop = areaEl.scrollHeight;
      });
    }
  };

  return {
    autoScroll,
    desacoplar: () => {
      areaEl.removeEventListener('scroll', verificarScroll);
      if (frameId) cancelAnimationFrame(frameId);
    }
  };
}

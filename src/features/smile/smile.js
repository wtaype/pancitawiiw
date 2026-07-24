// src/features/smile/smile.js
// Lógica de interacción para la burbuja flotante de sonrisa pancitawii

document.addEventListener('DOMContentLoaded', () => {
  const bubble = document.getElementById('smile_bubble');
  if (!bubble) return;

  // Cargar tema y fuente guardados para que coincida con el app principal
  let temaGuardado = 'futuro';
  try {
    const rawTema = localStorage.getItem('wiTema');
    if (rawTema) {
      const parsed = JSON.parse(rawTema);
      temaGuardado = parsed?.value || rawTema;
    }
  } catch (_) {
    temaGuardado = localStorage.getItem('wiTema') || 'futuro';
  }

  const fuenteGuardada = localStorage.getItem('wiFont') || 'outfit';
  document.documentElement.setAttribute('data-theme', temaGuardado);
  document.documentElement.setAttribute('data-font', fuenteGuardada);

  let startX = 0;
  let startY = 0;

  // Filtrar arrastre vs click midiendo las coordenadas del mouse
  bubble.addEventListener('mousedown', (e) => {
    startX = e.screenX;
    startY = e.screenY;
  });

  bubble.addEventListener('mouseup', (e) => {
    const diffX = Math.abs(e.screenX - startX);
    const diffY = Math.abs(e.screenY - startY);
    
    // Si el mouse se movió menos de 5 píxeles, es un clic y no un arrastre
    if (diffX < 5 && diffY < 5) {
      if (window.__TAURI__) {
        const core = window.__TAURI__.core || window.__TAURI__.tauri;
        if (core && typeof core.invoke === 'function') {
          core.invoke('toggle_smile')
            .catch(err => console.error('Error al alternar sonrisa:', err));
        }
      }
    }
  });

  // Clic derecho para restablecer posiciones por defecto
  bubble.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (window.__TAURI__) {
      const core = window.__TAURI__.core || window.__TAURI__.tauri;
      if (core && typeof core.invoke === 'function') {
        core.invoke('restablecer_posiciones')
          .catch(err => console.error('Error al restablecer posiciones:', err));
      }
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'wiTema' && e.newValue) {
      let temaVal = e.newValue;
      try {
        const parsed = JSON.parse(e.newValue);
        temaVal = parsed?.value || e.newValue;
      } catch (_) {}
      document.documentElement.setAttribute('data-theme', temaVal);
    }
    if (e.key === 'wiFont' && e.newValue) {
      document.documentElement.setAttribute('data-font', e.newValue);
    }
  });

  // Escuchar evento de cierre de la ventana sonrisa desde la barra de tareas de Windows
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      const getCurrentWin = window.__TAURI__.webviewWindow?.getCurrentWebviewWindow || window.__TAURI__.window?.getCurrentWindow;
      if (typeof getCurrentWin === 'function') {
        const currentWin = getCurrentWin();
        currentWin?.onCloseRequested(async () => {
          const core = window.__TAURI__.core || window.__TAURI__.tauri;
          if (core && typeof core.invoke === 'function') {
            await core.invoke('cerrar_aplicacion_completa').catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn('[Smile] Error al registrar onCloseRequested:', err);
    }
  }
});

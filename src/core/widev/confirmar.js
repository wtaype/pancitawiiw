// src/lib/widev/confirmar.js
// wiConfirmar v1.0: Módulo unificado para modales de confirmación interactivos y premium (Promesas-based)
// CSS inyectado dinámicamente para garantizar portabilidad y compatibilidad de temas

const _ico = {
  success: 'fa-circle-check',
  danger:  'fa-triangle-exclamation',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info'
};

const _inyectarCSS = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('widev-confirmar-css')) return;

  const s = document.createElement('style');
  s.id = 'widev-confirmar-css';
  s.textContent = `
    .wic-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 9999999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 38vh;
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: auto;
    }
    .wic-overlay.active {
      opacity: 1;
    }
    .wic-modal {
      background: var(--wb, #151b2e);
      border: 1px solid var(--brd, #2d3a52);
      border-radius: 12px;
      padding: 30px;
      width: 420px;
      max-width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3);
      transform: scale(0.9) translateY(2vh);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .wic-overlay.active .wic-modal {
      transform: scale(1) translateY(0);
    }
    .wic-header {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .wic-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .wic-icon--success { background: rgba(37, 182, 42, 0.1); color: var(--success, #25b62a); }
    .wic-icon--danger   { background: rgba(255, 56, 73, 0.1);  color: var(--error,   #ff3849); }
    .wic-icon--warning  { background: rgba(255, 167, 38, 0.1); color: var(--warning, #ffa726); }
    .wic-icon--info     { background: rgba(14, 190, 255, 0.1);  color: var(--info,    #0EBEFF); }

    .wic-title {
      font-family: var(--ff_P, 'Poppins');
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--tx, #e0e7ff);
    }
    .wic-message {
      font-family: var(--ff_O, 'Outfit');
      font-size: 0.8rem;
      line-height: 1.6;
      color: var(--tx2, #a5b4fc);
    }
    .wic-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 5px;
    }
    .wic-btn {
      padding: 10px 20px;
      font-family: var(--ff_P, 'Poppins');
      font-size: 0.76rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .wic-btn--cancel {
      background: var(--bg3, #1a2235);
      border: 1px solid var(--brd, #2d3a52);
      color: var(--tx2, #a5b4fc);
    }
    .wic-btn--cancel:hover {
      background: var(--bg4);
      color: var(--tx);
      border-color: var(--mco);
    }
    .wic-btn--confirm {
      background: var(--mco, #00f3ff);
      color: var(--bg, #0a0e1a);
    }
    .wic-btn--confirm.wic-btn--danger {
      background: var(--error, #ff3849);
      color: var(--white, #fff);
    }
    .wic-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.08);
    }
    .wic-btn:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(s);
};

export function wiConfirmar(mensaje, opciones = {}) {
  if (typeof document === 'undefined') return Promise.resolve(false);
  _inyectarCSS();

  const config = {
    titulo: 'Confirmar Acción',
    tipo: 'warning', // success, danger, warning, info
    siTexto: 'Aceptar',
    noTexto: 'Cancelar',
    ...opciones
  };

  return new Promise((resolve) => {
    // 1. Crear estructura DOM
    const overlay = document.createElement('div');
    overlay.className = 'wic-overlay';

    overlay.innerHTML = `
      <div class="wic-modal">
        <div class="wic-header">
          <div class="wic-icon wic-icon--${config.tipo}">
            <i class="fa-solid ${_ico[config.tipo] || 'fa-circle-info'}"></i>
          </div>
          <div class="wic-title">${config.titulo}</div>
        </div>
        <div class="wic-message">${mensaje}</div>
        <div class="wic-footer">
          <button type="button" class="wic-btn wic-btn--cancel" id="wic-btn-no">${config.noTexto}</button>
          <button type="button" class="wic-btn wic-btn--confirm ${config.tipo === 'danger' ? 'wic-btn--danger' : ''}" id="wic-btn-si">${config.siTexto}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Forzar la animación de entrada
    requestAnimationFrame(() => overlay.classList.add('active'));

    const btnSi = overlay.querySelector('#wic-btn-si');
    const btnNo = overlay.querySelector('#wic-btn-no');

    // Foco automático en el botón de confirmar para mejorar usabilidad
    setTimeout(() => btnSi.focus(), 50);

    const cerrarConResultado = (resultado) => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        resolve(resultado);
      }, 250);
    };

    // Eventos de Click
    btnSi.addEventListener('click', () => cerrarConResultado(true));
    btnNo.addEventListener('click', () => cerrarConResultado(false));

    // Cerrar al hacer click en el fondo
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cerrarConResultado(false);
      }
    });

    // Cerrar al pulsar Escape o confirmar al pulsar Enter
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.removeEventListener('keydown', keyHandler);
        cerrarConResultado(false);
      }
    };
    window.addEventListener('keydown', keyHandler);
  });
}

export default wiConfirmar;

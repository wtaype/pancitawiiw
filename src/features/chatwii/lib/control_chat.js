// src/features/chatwii/lib/control_chat.js
// Controlador de eventos de usuario, entradas de texto y puentes IPC para ChatWii

export class ControlChat {
  constructor({ textarea, btnSend, onEnviar }) {
    this.textarea = textarea;
    this.btnSend = btnSend;
    this.onEnviar = onEnviar;

    this.initEvents();
  }

  initEvents() {
    if (this.textarea) {
      this.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.dispararEnvio();
        }
      });
      this.textarea.addEventListener('input', () => {
        this.actualizarBoton();
      });
    }

    if (this.btnSend) {
      this.btnSend.addEventListener('click', () => {
        this.dispararEnvio();
      });
    }
  }

  actualizarBoton() {
    if (this.btnSend && this.textarea) {
      const tieneTexto = this.textarea.value.trim().length > 0;
      this.btnSend.disabled = !tieneTexto;
    }
  }

  dispararEnvio() {
    if (!this.textarea) return;
    const texto = this.textarea.value.trim();
    if (!texto) return;

    this.textarea.value = '';
    this.actualizarBoton();

    if (typeof this.onEnviar === 'function') {
      this.onEnviar(texto);
    }
  }
}

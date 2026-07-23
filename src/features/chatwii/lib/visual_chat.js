// src/features/chatwii/lib/visual_chat.js
// Renderizador visual, componentes DOM y Virtual Scroll a 60-120 FPS para ChatWii

import { mdToHtml as parseMd, procesarHtml } from './escribirmd.js';
import { wicopy, wiVirtualScroll } from '@widev';

export const mdToHtml = (txt) => {
  const html = parseMd(txt);
  return procesarHtml(html);
};

export class VisualChat {
  constructor(messagesContainer) {
    this.container = messagesContainer;
    this.scrollLocked = false;
    this.messages = [];

    if (this.container) {
      this.initVirtualScroll();
    }
  }

  // Inicializa el motor de Virtual Scroll para mantener ~10-15 nodos activos en el DOM
  initVirtualScroll() {
    this.vscroll = new wiVirtualScroll({
      container: this.container,
      items: this.messages,
      itemHeight: 75,
      buffer: 4,
      renderRow: (msg) => this.crearBurbujaMensaje(msg.autor, msg.texto, msg.esUsuario)
    });
  }

  // Scroll automático inteligente
  scrollAlFinal() {
    if (this.vscroll && !this.scrollLocked) {
      this.vscroll.scrollToBottom();
    }
  }

  // Crear elemento de burbuja de mensaje
  crearBurbujaMensaje(autor, texto, esUsuario = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `cr_chat_msg ${esUsuario ? 'user' : 'bot'}`;

    const iconHtml = esUsuario
      ? '<i class="fa-solid fa-user"></i>'
      : '<i class="fa-solid fa-robot"></i>';

    const contenidoHtml = mdToHtml(texto);

    wrapper.innerHTML = `
      <div class="cr_chat_msg_avatar">${iconHtml}</div>
      <div class="cr_chat_msg_body">
        <div class="cr_chat_msg_meta">
          <span class="cr_chat_msg_author">${autor}</span>
        </div>
        <div class="cr_chat_msg_content">${contenidoHtml}</div>
        <div class="cr_chat_msg_actions">
          <button class="cr_chat_btn_copy" title="Copiar mensaje">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
      </div>
    `;

    // Conectar botón de copiar
    const copyBtn = wrapper.querySelector('.cr_chat_btn_copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        wicopy(texto);
      });
    }

    return wrapper;
  }

  // Agregar mensaje a la lista virtual
  agregarMensaje(autor, texto, esUsuario = false) {
    const msg = { autor, texto, esUsuario };
    this.messages.push(msg);

    if (this.vscroll) {
      this.vscroll.updateItems(this.messages, true);
    }
    return msg;
  }

  // Cargar historial masivo con Virtual Scroll instantáneo
  cargarHistorial(historial = []) {
    this.messages = historial.map(m => ({
      autor: m.autor || (m.esUsuario ? 'Tú' : 'Pancitawii'),
      texto: m.texto || m.content || '',
      esUsuario: m.esUsuario ?? (m.role === 'user')
    }));

    if (this.vscroll) {
      this.vscroll.updateItems(this.messages, true);
    }
  }

  // Crear burbuja de mensaje con streaming activo
  crearBurbujaStreaming(autor = 'Pancitawii') {
    if (!this.container) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'cr_chat_msg bot streaming_active';
    wrapper.innerHTML = `
      <div class="cr_chat_msg_avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="cr_chat_msg_body">
        <div class="cr_chat_msg_meta">
          <span class="cr_chat_msg_author">${autor}</span>
          <span class="cr_chat_streaming_indicator"><i class="fa-solid fa-circle-notch fa-spin"></i> Escribiendo...</span>
        </div>
        <div class="cr_chat_msg_content"></div>
      </div>
    `;

    // Montar temporalmente en el viewport de vscroll
    const targetViewport = this.vscroll?.viewport || this.container;
    targetViewport.appendChild(wrapper);
    this.scrollAlFinal();

    const contentDiv = wrapper.querySelector('.cr_chat_msg_content');
    let bufferTexto = '';

    return {
      wrapper,
      contentDiv,
      actualizarChunk: (chunk) => {
        bufferTexto += chunk;
        if (contentDiv) {
          contentDiv.innerHTML = mdToHtml(bufferTexto);
        }
        this.scrollAlFinal();
      },
      finalizar: () => {
        wrapper.remove(); // Remover nodo temporal de streaming
        this.agregarMensaje(autor, bufferTexto, false); // Guardar en lista virtualizada de mensajes
        return bufferTexto;
      }
    };
  }

  // Limpiar mensajes visuales y reiniciar motor
  limpiar() {
    this.messages = [];
    if (this.vscroll) {
      this.vscroll.updateItems([], false);
    }
  }
}

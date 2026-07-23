// src/features/chatwii/lib/visual_chat.js
// Renderizador visual, componentes DOM y animaciones de streaming para ChatWii

import { mdToHtml as parseMd, procesarHtml } from './escribirmd.js';
import { wicopy } from '@widev';

export const mdToHtml = (txt) => {
  const html = parseMd(txt);
  return procesarHtml(html);
};

export class VisualChat {
  constructor(messagesContainer) {
    this.container = messagesContainer;
    this.scrollLocked = false;
  }

  // Scroll automático inteligente
  scrollAlFinal() {
    if (this.container && !this.scrollLocked) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  // Crear burbuja de mensaje
  crearBurbujaMensaje(autor, texto, esUsuario = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `cr_chat_msg ${esUsuario ? 'user' : 'bot'}`;

    const iconHtml = esUsuario
      ? '<i class="fa-solid fa-user"></i>'
      : '<i class="fa-solid fa-robot"></i>';

    const contenidoHtml = esUsuario ? mdToHtml(texto) : mdToHtml(texto);

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

  // Agregar mensaje a la lista visual
  agregarMensaje(autor, texto, esUsuario = false) {
    if (!this.container) return null;
    const node = this.crearBurbujaMensaje(autor, texto, esUsuario);
    this.container.appendChild(node);
    this.scrollAlFinal();
    return node;
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

    this.container.appendChild(wrapper);
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
        wrapper.classList.remove('streaming_active');
        const indicator = wrapper.querySelector('.cr_chat_streaming_indicator');
        if (indicator) indicator.remove();
        return bufferTexto;
      }
    };
  }

  // Limpiar mensajes visuales
  limpiar() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

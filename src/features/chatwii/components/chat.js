// src/features/chatwii/components/chat.js
// Orquestador del Widget de Chatwii

import { crearHeader } from './header_chat.js';
import { crearBody } from './body_chat.js';
import { crearFooter } from './footer_chat.js';

export const crearVentanaChat = (persona) => {
  const widget = document.createElement('div');
  widget.id = 'chat_nuevo';
  widget.className = 'cr_chat_widget cr_chat_widget_plano active';

  widget.innerHTML = `
    <!-- Overlay de Arrastrar Archivo -->
    <div class="cr_chat_drag_overlay">
      <div class="cr_chat_drag_overlay_content">
        <i class="fas fa-file-image"></i>
        <span>Suelta la imagen aquí 🎨</span>
      </div>
    </div>

    ${crearHeader(persona)}
    ${crearBody()}
    ${crearFooter()}
  `;

  return widget;
};

export { crearModalConfirmacion } from './confirm_chat.js';

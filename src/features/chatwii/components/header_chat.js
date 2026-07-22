// src/features/chatwii/components/header_chat.js
// Cabecera del Chatwii - Pancitawii

export const crearHeader = (persona) => {
  return `
    <div class="chatwii_header" id="header_chatwii">
      <img src="${persona.avatar}" alt="${persona.nombre}" class="cr_chat_header_avatar" id="cr_chat_avatar_btn" />
      <div class="cr_chat_header_info">
        <div class="cr_chat_header_name">${persona.nombre} Asistente</div>
        <div class="cr_chat_header_status">
          <span class="cr_chat_online_dot"></span>
          <span>${persona.estadoOnline.es}</span>
        </div>
      </div>
      
      <div class="cr_chat_header_actions">
        <!-- Nueva conversación -->
        <button class="cr_chat_btn_header nuevo" id="cr_chat_btn_nuevo" data-witip="Nueva conversación">
          <i class="fas fa-plus"></i>
        </button>
        
        <!-- Exportar historial -->
        <button class="cr_chat_btn_header export" id="cr_chat_btn_exportar" data-witip="Exportar historial">
          <i class="fas fa-file-export"></i>
        </button>

        <!-- Limpiar conversación actual -->
        <button class="cr_chat_btn_header clear" id="cr_chat_btn_limpiar" data-witip="Limpiar chat">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `;
};

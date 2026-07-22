// src/features/chatwii/components/confirm_chat.js
// Modal de confirmación para borrar el chat

export const crearModalConfirmacion = () => {
  const modal = document.createElement('div');
  modal.id = 'chat_confirm';
  modal.className = 'wiModal confirm_chatwii';

  modal.innerHTML = `
    <div class="modalBody cr_modal_body">
      <button class="modalX">&times;</button>
      <div class="cr_confirm_content">
        <div class="cr_modal_icon warning">
          <i class="fas fa-trash-alt"></i>
        </div>
        <h3 class="cr_modal_title">Limpiar conversación</h3>
        <p class="cr_modal_desc">¿Estás seguro de que deseas borrar todos los mensajes? Esta acción no se puede deshacer.</p>
        <div class="cr_modal_actions">
          <button id="cr_chat_btn_confirm_clear" class="cr_modal_btn danger">
            Sí, limpiar
          </button>
          <button id="cr_chat_btn_cancel_clear" class="cr_modal_btn outline">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `;

  return modal;
};

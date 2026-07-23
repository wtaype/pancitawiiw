// src/features/chatwii/components/footer_chat.js
// Entrada y pie de página de Chatwii (Segunda Imagen)

export const crearFooter = () => {
  return `
    <div class="chatwii_footer" id="footer_chatwii">
      <!-- Previsualización de imágenes a adjuntar -->
      <div id="cr_chat_image_previews" class="cr_chat_image_previews"></div>
      
      <!-- Caja de Citas/Reply -->
      <div id="cr_chat_reply_box" class="cr_chat_reply_box">
        <div class="cr_chat_reply_indicator_bar"></div>
        <div class="cr_chat_reply_content">
          <span class="cr_chat_reply_author" id="cr_chat_reply_author"></span>
          <p class="cr_chat_reply_text" id="cr_chat_reply_text"></p>
        </div>
        <button type="button" id="cr_btn_close_reply" class="cr_btn_close_reply" title="Cancelar respuesta">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenedor del input unificado (Textarea + Fila de Acciones) -->
      <div class="cr_chat_input_wrapper">
        <textarea 
          class="cr_chat_textarea" 
          id="cr_chat_textarea"
          placeholder="Pregúntale a Pancita..." 
          rows="1"
          maxlength="50000"
          lang="es-419"
          spellcheck="true"
        ></textarea>
        
        <div class="cr_chat_input_actions_row">
          <!-- Botón de Adjuntar Imagen (Plus) -->
          <button type="button" class="cr_chat_btn_attach" id="cr_chat_btn_attach" title="Adjuntar imagen">
            <i class="fas fa-plus"></i>
          </button>
          
          <!-- Input tipo File invisible para abrir explorador de archivos -->
          <input type="file" id="cr_chat_file_input" accept="image/*" />
          
          <!-- Botón de Enviar (Flecha arriba) -->
          <button class="cr_chat_btn_send" id="cr_chat_btn_send" disabled title="Enviar mensaje">
            <i class="fas fa-arrow-up"></i>
          </button>
        </div>
      </div>
      
      <div class="cr_chat_disclaimer">
        Pancita puede cometer errores. Considera verificar la información importante.
      </div>
    </div>
  `;
};

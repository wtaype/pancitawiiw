// src/core/widev/editor.js
// Componente Core wiEditor: Enriquecedor de Textareas para formato Markdown con barra de herramientas, modal premium, y vista previa integrada.

import { abrirModal, cerrarModal } from './modales.js';
import { wiMd } from './wimd.js';
import { Notificacion } from './mensajes.js';
import { comprimirImagen } from './comprimir.js';
import { wicopy } from './copy.js';
import { wiGaleria } from './galeria.js';

// Inyección automática de estilos CSS de wiEditor en el DOM (Cero Inline CSS)
if (typeof document !== 'undefined' && !document.getElementById('wi-editor-injected-styles')) {
  const style = document.createElement('style');
  style.id = 'wi-editor-injected-styles';
  style.textContent = `
    .wi_editor_modal_body {
      max-width: 400px !important;
      padding: 24px !important;
      border-radius: 12px !important;
      background: var(--bg4) !important;
      border: 1px solid var(--brd) !important;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5) !important;
    }
    
    .wi_editor_modal_img_body {
      max-width: 500px !important;
    }
    
    .wi_editor_modal_title {
      margin: 0 0 16px 0 !important;
      font-size: 1rem !important;
      font-weight: 700 !important;
      color: var(--tx) !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .wi_editor_modal_title i {
      color: var(--mco) !important;
    }
    
    .wi_editor_modal_field {
      margin-bottom: 14px !important;
    }
    
    .wi_editor_modal_field.last {
      margin-bottom: 20px !important;
    }
    
    .wi_editor_modal_label {
      display: flex !important;
      flex-direction: column !important;
      margin-bottom: 6px !important;
      font-size: 0.78rem !important;
      font-weight: 600 !important;
      color: var(--tx2) !important;
      width: 100% !important;
      gap: 6px !important;
    }
    
    .wi_editor_modal_input {
      width: 100% !important;
      box-sizing: border-box !important;
      height: 38px !important;
    }
    
    .wi_editor_modal_actions {
      display: flex !important;
      justify-content: flex-end !important;
      gap: 8px !important;
    }
    
    .wi_editor_modal_img_actions {
      margin-top: 16px !important;
    }
    
    .wi_editor_modal_btn {
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 0.78rem !important;
      cursor: pointer !important;
      transition: all var(--tr_f) !important;
      border: 1px solid transparent;
    }
    
    .wi_editor_modal_btn_cancel {
      background: transparent !important;
      border-color: var(--brd) !important;
      color: var(--tx2) !important;
      padding: 0 14px !important;
    }
    
    .wi_editor_modal_btn_cancel:hover {
      background: var(--bg5) !important;
      color: var(--tx) !important;
      border-color: var(--mco) !important;
    }
    
    .wi_editor_modal_btn_submit {
      background: var(--mco) !important;
      color: var(--txa) !important;
      border-color: var(--mco) !important;
      padding: 0 16px !important;
    }
    
    .wi_editor_modal_btn_submit:hover {
      background: var(--hv) !important;
      border-color: var(--hv) !important;
    }

    .wi_editor_add_link_btn {
      height: 38px !important;
    }
    
    .wi_editor_add_link_btn_icon {
      margin-right: 4px !important;
    }

    /* ── Contenedor General del Editor Enriquecido ── */
    .wi_editor_container {
      display: flex;
      flex-direction: column;
      width: 100%;
      border: 1px solid var(--brd);
      border-radius: 8px;
      overflow: hidden;
      background: var(--wb);
      box-sizing: border-box;
    }

    /* Toolbar Premium con Altura Constante */
    .ejem_bran_editor_toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg4);
      border-bottom: 1px solid var(--brd);
      padding: 6px 12px;
      width: 100%;
      height: 40px;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .wi_editor_toolbar_left {
      display: flex;
      gap: 3px;
      align-items: center;
      overflow-x: auto;
      scrollbar-width: none; /* Firefox */
      flex: 1;
    }

    .wi_editor_toolbar_left::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    /* Botones del Toolbar - Prefijados con wi_editor_ y color uniforme con witema */
    .wi_editor_toolbar_btn {
      background: transparent;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--mco) !important; /* Todos los botones usan color de marca --mco */
      transition: background var(--tr_f) ease, color var(--tr_f) ease;
      font-size: 0.85rem;
      padding: 0;
    }

    .wi_editor_toolbar_btn:hover {
      background: var(--bg5);
      color: var(--hv) !important;
    }

    /* Texto alternativo para H2/H3 */
    .wi_editor_btn_text {
      font-weight: 700;
      font-size: 0.72rem;
      font-family: var(--ff_P);
    }

    /* Modificadores de color específicos para iconos temáticos */
    .wi_editor_btn_si {
      color: #3cd741 !important;
    }
    
    .wi_editor_btn_no {
      color: #ff3849 !important;
    }

    .wi_editor_toolbar_right {
      display: flex;
      gap: 2px;
      background: var(--bg5);
      padding: 2px;
      border-radius: 6px;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .wi_editor_tab_btn {
      background: transparent;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--tx3);
      cursor: pointer;
      font-family: var(--ff_P);
      transition: all var(--tr_f) ease;
    }

    .wi_editor_tab_btn:hover {
      color: var(--tx);
    }

    .wi_editor_tab_btn.active {
      background: var(--wb);
      color: var(--mco);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    /* Estilo del Textarea y Vista Previa (Altura Optimizada) */
    .wi_editor_container .notas-textarea,
    .wi_editor_container .ejem_bran_textarea {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
      margin: 0 !important;
      outline: none !important;
      min-height: 48vh !important;
      padding: 15px !important;
      font-family: var(--ff_O) !important;
      font-size: var(--fz_m) !important;
      color: var(--tx) !important;
      box-sizing: border-box !important;
      resize: vertical !important;
    }

    .wi_editor_preview {
      padding: 15px;
      background: var(--inp);
      color: var(--tx);
      font-size: var(--fz_m);
      font-family: var(--ff_O);
      line-height: 1.7;
      min-height: 48vh !important;
      overflow-y: auto;
      box-sizing: border-box;
      flex: 1;
    }

    /* Paneles de Enlaces y Galería */
    .wi_editor_links_panel,
    .wi_editor_gallery_panel {
      padding: 16px;
      background: var(--bg4);
      min-height: 48vh !important;
      box-sizing: border-box;
      flex: 1;
      overflow-y: auto;
    }
    
    .wi_editor_links_panel:focus,
    .wi_editor_gallery_panel:focus {
      outline: none !important;
    }
    
    /* Enlaces */
    .wi_editor_links_form {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      align-items: flex-end;
    }
    
    .wi_editor_links_input_wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .wi_editor_links_form .wi_editor_modal_label {
      margin-bottom: 0 !important;
    }
    
    .wi_editor_links_label_wrap {
      flex: 1 !important;
    }
    
    .wi_editor_links_url_wrap {
      flex: 2.2 !important;
    }
    
    .wi_editor_links_list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    
    .wi_editor_link_pill {
      display: inline-flex;
      align-items: center;
      background: var(--wb);
      border: 1px solid var(--brd);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--tx);
      position: relative;
      padding-right: 32px;
    }
    
    .wi_editor_link_pill a {
      color: var(--tx);
      text-decoration: none;
      display: flex;
      align-items: center;
    }
    
    .wi_editor_link_pill a:hover {
      color: var(--mco);
      text-decoration: underline;
    }
    
    .wi_editor_link_pill_del {
      border: none;
      background: transparent;
      color: #ff3849;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0;
      display: flex;
      align-items: center;
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .wi_editor_link_pill_del:hover {
      color: #ff001c;
    }
    
    .wi_editor_link_copy {
      cursor: pointer;
      margin-right: 8px;
      color: var(--mco);
    }

    /* Galería */
    .wi_editor_gallery_upload_zone {
      border: 2px dashed var(--brd);
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      background: var(--wb);
      cursor: pointer;
      transition: all var(--tr_f);
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .wi_editor_gallery_upload_zone:hover,
    .wi_editor_gallery_upload_zone.dragover {
      border-color: var(--mco);
      background: var(--bg5);
    }
    
    .wi_editor_gallery_upload_zone i {
      font-size: 1.8rem;
      color: var(--tx3);
    }
    
    .wi_editor_gallery_upload_zone span {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--tx2);
    }
    
    .wi_editor_hidden_file_input {
      display: none !important;
    }
    
    .wi_editor_gallery_grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    }
    
    .wi_editor_gallery_item {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--brd);
      aspect-ratio: 1;
      background: var(--wb);
    }
    
    .wi_editor_gallery_item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .wi_editor_gallery_item_del {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 56, 73, 0.95);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.72rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 5;
      transition: background var(--tr_f);
    }
    
    .wi_editor_gallery_item_del:hover {
      background: #ff001c;
    }

    /* Subsecciones de Vista Previa (Preview) */
    .wi_editor_preview_section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--brd);
    }
    
    .wi_editor_preview_title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--tx1);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .wi_editor_preview_title i {
      color: var(--mco);
    }
    
    .wi_editor_preview_links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .wi_editor_preview_link_btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--wb);
      border: 1px solid var(--brd);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--mco);
      text-decoration: none;
      transition: all var(--tr_f);
    }
    
    .wi_editor_preview_link_btn:hover {
      background: var(--mco);
      color: var(--txa);
      border-color: var(--mco);
    }
    
    .wi_editor_preview_gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .wi_editor_preview_gallery_img {
      border-radius: 6px;
      border: 1px solid var(--brd);
      width: 100%;
      aspect-ratio: 1.5;
      object-fit: cover;
      cursor: pointer;
      transition: transform var(--tr_f);
    }
    
    .wi_editor_preview_gallery_img:hover {
      transform: scale(1.03);
    }

    /* Cuadrícula del Selector de Insertar Imagen del Modal */
    .wi_editor_insert_img_grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
      gap: 10px !important;
      max-height: 250px !important;
      overflow-y: auto !important;
      margin-top: 10px !important;
    }

    .wi_editor_insert_img_grid .wi_editor_gallery_item {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--brd);
      aspect-ratio: 1;
      background: var(--wb);
      cursor: pointer;
      transition: border-color var(--tr_f);
    }
    .wi_editor_insert_img_grid .wi_editor_gallery_item:hover {
      border-color: var(--mco);
    }
    .wi_editor_insert_img_grid .wi_editor_gallery_item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Clases de Control de Visibilidad y Estado del Editor */
    .wi_editor_hidden {
      display: none !important;
    }
    
    .wi_editor_disabled_toolbar {
      opacity: 0.3 !important;
      pointer-events: none !important;
    }

    /* Estilos del contenido Markdown parseado (Vistas Previa) */
    .wi_editor_preview h1,
    .wi_editor_preview h2,
    .wi_editor_preview h3,
    .wi_editor_preview h4 {
      font-family: var(--ff_O);
      font-weight: 700;
      color: var(--tx1);
      margin-top: 1.5rem;
      margin-bottom: 0.8rem;
    }
    
    .wi_editor_preview h2 {
      font-size: 1.15rem;
      border-bottom: 1px solid var(--brd);
      padding-bottom: 4px;
    }

    .wi_editor_preview h3 {
      font-size: 1rem;
      color: var(--mco);
    }

    .wi_editor_preview p {
      margin-bottom: 0.8rem;
    }

    .wi_editor_preview ul,
    .wi_editor_preview ol {
      margin: 0 0 1rem 1.5rem;
      padding: 0;
    }

    .wi_editor_preview li {
      margin-bottom: 0.4rem;
    }

    .wi_editor_preview blockquote {
      margin: 1.5rem 0;
      padding: 10px 15px;
      background: var(--bg4);
      border-left: 4px solid var(--mco);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: var(--tx2);
    }

    .wi_editor_preview pre {
      background: var(--bg3);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
      border: 1px solid var(--brd);
    }

    .wi_editor_preview code {
      font-family: monospace;
      font-size: 0.85rem;
      background: rgba(0,0,0,0.04);
      padding: 2px 4px;
      border-radius: 4px;
    }

    .wi_editor_preview pre code {
      background: transparent;
      padding: 0;
    }

    .po_table_wrap {
      width: 100%;
      overflow-x: auto;
      margin: 1.5rem 0;
      border-radius: 8px;
      border: 1px solid var(--brd);
      background: var(--wb);
    }

    .po_table_wrap table {
      width: 100%;
      border-collapse: collapse;
    }

    .po_table_wrap th,
    .po_table_wrap td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--brd);
      border-right: 1px solid var(--brd);
      font-size: 0.82rem;
    }

    .po_table_wrap th {
      background: var(--bg4);
      color: var(--mco);
      font-weight: 700;
      text-align: left;
    }

    .po_table_wrap tr:last-child td {
      border-bottom: none;
    }

    .po_table_wrap th:last-child,
    .po_table_wrap td:last-child {
      border-right: none;
    }

    /* Alertas tipo GitHub */
    .po_alert {
      margin: 1.5rem 0;
      padding: 12px 16px;
      border-left: 4px solid var(--info);
      background: rgba(0, 168, 230, 0.06);
      border-radius: 0 8px 8px 0;
    }
    
    .po_alert_title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 0.82rem;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .po_alert_note { border-left-color: var(--info); background: rgba(0, 168, 230, 0.06); }
    .po_alert_note .po_alert_title { color: var(--info); }
    
    .po_alert_warning { border-left-color: var(--warning); background: rgba(255, 167, 38, 0.06); }
    .po_alert_warning .po_alert_title { color: var(--warning); }

    /* Clases de colores para Iconos Premium */
    .po_ico_red { color: #fe0149; }
    .po_ico_yellow { color: #ffb636; }
    .po_ico_green { color: #3cd741; }
    .po_ico_cyan { color: #0edeff; }
    .po_ico_gold { color: #e0a910; }
    .po_ico_mco { color: var(--mco); }
    .po_ico_warning { color: var(--warning); }
  `;
  document.head.appendChild(style);
}

// Función para aplicar formato en la selección del textarea
const aplicarFormato = (textarea, tipo, extraData = {}) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  
  let replacement = '';
  let cursorOffset = 0;

  switch (tipo) {
    case 'bold':
      replacement = `**${selectedText || 'texto'}**`;
      cursorOffset = selectedText ? replacement.length : 2;
      break;
    case 'italic':
      replacement = `*${selectedText || 'texto'}*`;
      cursorOffset = selectedText ? replacement.length : 1;
      break;
    case 'h2':
      replacement = `\n## ${selectedText || 'Título'}`;
      cursorOffset = replacement.length;
      break;
    case 'h3':
      replacement = `\n### Subtítulo`;
      cursorOffset = replacement.length;
      break;
    case 'list':
      replacement = `\n- ${selectedText || 'elemento'}`;
      cursorOffset = replacement.length;
      break;
    case 'quote':
      replacement = `\n> ${selectedText || 'Cita'}`;
      cursorOffset = replacement.length;
      break;
    case 'code':
      replacement = `\n\`\`\`javascript\n${selectedText || '// código aquí'}\n\`\`\``;
      cursorOffset = replacement.length;
      break;
    case 'table':
      replacement = `\n| Cabecera 1 | Cabecera 2 |\n| --- | --- |\n| Celda 1 | Celda 2 |\n`;
      cursorOffset = replacement.length;
      break;
    case 'si':
      replacement = `:si: ${selectedText}`;
      cursorOffset = replacement.length;
      break;
    case 'no':
      replacement = `:no: ${selectedText}`;
      cursorOffset = replacement.length;
      break;
    case 'alert-info':
      replacement = `\n> [!NOTE]\n> ${selectedText || 'Contenido de la nota'}`;
      cursorOffset = replacement.length;
      break;
    case 'alert-warning':
      replacement = `\n> [!WARNING]\n> ${selectedText || 'Contenido de la advertencia'}`;
      cursorOffset = replacement.length;
      break;
    case 'link':
      replacement = `[${extraData.text || selectedText || 'Enlace'}](${extraData.url || 'https://'})`;
      cursorOffset = replacement.length;
      break;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
};

// Asegurar que el modal de enlaces existe en el DOM
const asegurarLinkModal = () => {
  if (typeof document === 'undefined') return null;
  let modal = document.getElementById('wi_editor_link_modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'wiModal';
  modal.id = 'wi_editor_link_modal';
  modal.innerHTML = `
    <div class="modalBody wim_body wi_editor_modal_body">
      <h3 class="wi_editor_modal_title">
        <i class="fa-solid fa-link"></i> Insertar Enlace
      </h3>
      
      <div class="wi_editor_modal_field">
        <label class="wi_editor_modal_label">Texto a mostrar</label>
        <input type="text" id="wi_editor_link_text" class="ejem_bran_input wi_editor_modal_input" placeholder="Texto descriptivo...">
      </div>
      
      <div class="wi_editor_modal_field last">
        <label class="wi_editor_modal_label">Dirección URL (Link)</label>
        <input type="url" id="wi_editor_link_url" class="ejem_bran_input wi_editor_modal_input" placeholder="https://...">
      </div>

      <div class="wi_editor_modal_actions">
        <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_cancel" id="wi_editor_link_cancel">Cancelar</button>
        <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_submit" id="wi_editor_link_submit">Insertar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#wi_editor_link_cancel').addEventListener('click', () => {
    cerrarModal('wi_editor_link_modal');
  });

  return modal;
};

// Asegurar que el modal de insertar imagen existe en el DOM
const asegurarInsertImgModal = () => {
  if (typeof document === 'undefined') return null;
  let modal = document.getElementById('wi_editor_insert_img_modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'wiModal';
  modal.id = 'wi_editor_insert_img_modal';
  modal.innerHTML = `
    <div class="modalBody wim_body wi_editor_modal_body wi_editor_modal_img_body">
      <h3 class="wi_editor_modal_title">
        <i class="fa-solid fa-image"></i> Insertar Imagen de Galería
      </h3>
      
      <div class="wi_editor_modal_field">
        <label class="wi_editor_modal_label">Selecciona la captura para insertar en el cursor</label>
        <div class="wi_editor_insert_img_grid">
          <!-- Las miniaturas se inyectan dinámicamente -->
        </div>
      </div>

      <div class="wi_editor_modal_actions wi_editor_modal_img_actions">
        <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_cancel" id="wi_editor_insert_img_cancel">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#wi_editor_insert_img_cancel').addEventListener('click', () => {
    cerrarModal('wi_editor_insert_img_modal');
  });

  return modal;
};

// Función para abrir el selector de imágenes de la toolbar
const abrirInsertImgModal = (textarea) => {
  const modal = asegurarInsertImgModal();
  const grid = modal.querySelector('.wi_editor_insert_img_grid');
  grid.innerHTML = '';

  const imgs = textarea._imagenes || [];
  if (imgs.length === 0) {
    Notificacion('No hay imágenes en la galería para insertar. Ve a la pestaña Galería y sube algunas primero.', 'warning');
    return;
  }

  imgs.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'wi_editor_gallery_item';
    item.title = `Insertar imagen ${idx}`;
    item.innerHTML = `<img src="${img}" alt="Captura ${idx}">`;

    item.addEventListener('click', () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const replacement = `![imagen](${idx})`;
      textarea.value = text.substring(0, start) + replacement + text.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      cerrarModal('wi_editor_insert_img_modal');
      Notificacion('Marcador de imagen insertado', 'success');
    });

    grid.appendChild(item);
  });

  abrirModal('wi_editor_insert_img_modal');
};

/**
 * Convierte un textarea común en un editor enriquecido con barra de herramientas Markdown y pestañas.
 * 
 * @param {HTMLTextAreaElement|string} selector - Textarea o string selector
 * @param {object} opciones - Opciones de configuración
 */
export const wiEditor = (selector, opciones = {}) => {
  if (typeof document === 'undefined') return;

  const textarea = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!textarea || textarea.tagName !== 'TEXTAREA') {
    return console.warn('[wiEditor] Elemento no válido o no es un textarea');
  }

  // Prevenir inicializaciones dobles
  if (textarea.dataset.wieditorInit) return;
  textarea.dataset.wieditorInit = 'true';

  // Inicializar arreglos de recursos
  textarea._imagenes = [...(opciones.imagenes || [])];
  textarea._links = [...(opciones.links || [])];

  asegurarLinkModal();

  // 1. Envolver textarea en un contenedor del editor
  const parent = textarea.parentNode;
  const container = document.createElement('div');
  container.className = 'wi_editor_container';
  
  parent.insertBefore(container, textarea);
  
  // 2. Crear panel de preview, enlaces y galería con clase oculta por defecto
  const previewDiv = document.createElement('div');
  previewDiv.className = 'wi_editor_preview wi_editor_hidden';

  const linksDiv = document.createElement('div');
  linksDiv.className = 'wi_editor_links_panel wi_editor_hidden';

  const galleryDiv = document.createElement('div');
  galleryDiv.className = 'wi_editor_gallery_panel wi_editor_hidden';
  galleryDiv.tabIndex = 0; // Permitir recibir foco para capturar eventos de pegar (Ctrl+V)
  
  // Insertar paneles en el contenedor
  container.appendChild(textarea);
  container.appendChild(linksDiv);
  container.appendChild(galleryDiv);
  container.appendChild(previewDiv);

  // 3. Crear la barra de herramientas
  const toolbar = document.createElement('div');
  toolbar.className = 'ejem_bran_editor_toolbar';
  toolbar.innerHTML = `
    <!-- Lado Izquierdo: Acciones de formato -->
    <div class="wi_editor_toolbar_left">
      <button type="button" class="wi_editor_toolbar_btn" data-format="bold" data-witip="Negrita (Ctrl+B)">
        <i class="fa-solid fa-bold"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="italic" data-witip="Cursiva (Ctrl+I)">
        <i class="fa-solid fa-italic"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="h2" data-witip="Título H2">
        <span class="wi_editor_btn_text">H2</span>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="h3" data-witip="Título H3">
        <span class="wi_editor_btn_text">H3</span>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="list" data-witip="Lista (-)">
        <i class="fa-solid fa-list"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="quote" data-witip="Cita (> )">
        <i class="fa-solid fa-quote-left"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="code" data-witip="Bloque de Código">
        <i class="fa-solid fa-code"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="table" data-witip="Insertar Tabla">
        <i class="fa-solid fa-table"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn wi_editor_btn_si" data-format="si" data-witip="Check Verde Premium">
        <i class="fa-solid fa-circle-check"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn wi_editor_btn_no" data-format="no" data-witip="Cruz Roja Premium">
        <i class="fa-solid fa-circle-xmark"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="alert-info" data-witip="Caja Alerta Nota">
        <i class="fa-solid fa-circle-info"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="alert-warning" data-witip="Caja Alerta Advertencia">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="link" data-witip="Insertar Enlace">
        <i class="fa-solid fa-link"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="image-insert" data-witip="Insertar Imagen de Galería">
        <i class="fa-solid fa-image"></i>
      </button>
    </div>

    <!-- Lado Derecho: Pestañas Editor | Enlaces | Galería | Preview -->
    <div class="wi_editor_toolbar_right">
      <button type="button" class="wi_editor_tab_btn active" data-tab="edit">Editor</button>
      <button type="button" class="wi_editor_tab_btn" data-tab="links">Enlaces</button>
      <button type="button" class="wi_editor_tab_btn" data-tab="gallery">Galería</button>
      <button type="button" class="wi_editor_tab_btn" data-tab="preview">Preview</button>
    </div>
  `;

  // Insertar toolbar arriba de todo en el contenedor
  container.insertBefore(toolbar, textarea);

  // Botones de las pestañas
  const tabEdit = toolbar.querySelector('[data-tab="edit"]');
  const tabLinks = toolbar.querySelector('[data-tab="links"]');
  const tabGallery = toolbar.querySelector('[data-tab="gallery"]');
  const tabPreview = toolbar.querySelector('[data-tab="preview"]');
  const formatButtonsLeft = toolbar.querySelector('.wi_editor_toolbar_left');

  // Registrar wiGaleria para habilitar zoom premium en las capturas de las pestañas Galería y Preview
  const selectorGaleria = [
    '.wi_editor_gallery_panel .wi_editor_gallery_item img',
    '.wi_editor_preview .wi_editor_preview_gallery_img',
    '.wi_editor_preview img'
  ].join(', ');
  const galeriaInstance = wiGaleria(selectorGaleria, { altFallback: 'Captura del caso' });

  // Lógica de Renderizado del Panel de Enlaces
  linksDiv.innerHTML = `
    <div class="wi_editor_links_form">
      <div class="wi_editor_links_input_wrap wi_editor_links_label_wrap">
        <label class="wi_editor_modal_label">
          Etiqueta del enlace
          <input type="text" class="ejem_bran_input wi_editor_modal_input wi_editor_add_link_label" placeholder="Ej: Repositorio GitHub">
        </label>
      </div>
      <div class="wi_editor_links_input_wrap wi_editor_links_url_wrap">
        <label class="wi_editor_modal_label">
          Dirección URL
          <input type="url" class="ejem_bran_input wi_editor_modal_input wi_editor_add_link_url" placeholder="https://...">
        </label>
      </div>
      <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_submit wi_editor_add_link_btn">
        <i class="fa-solid fa-plus wi_editor_add_link_btn_icon"></i> Agregar
      </button>
    </div>
    <div class="wi_editor_links_list"></div>
  `;

  const refrescarEnlaces = () => {
    const list = linksDiv.querySelector('.wi_editor_links_list');
    list.innerHTML = '';
    
    textarea._links.forEach((lnk, idx) => {
      const pill = document.createElement('div');
      pill.className = 'wi_editor_link_pill';
      
      pill.innerHTML = `
        <i class="fa-solid fa-copy wi_editor_link_copy" title="Copiar enlace"></i>
        <a href="${lnk.url}" target="_blank" title="Abrir enlace: ${lnk.url}">
          <span>${lnk.etiqueta || lnk.label || 'Enlace'}</span>
        </a>
        <button type="button" class="wi_editor_link_pill_del" data-idx="${idx}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      
      // Listener para copiar el enlace al portapapeles usando wicopy
      pill.querySelector('.wi_editor_link_copy').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wicopy(lnk.url);
        Notificacion('Enlace copiado al portapapeles', 'success');
      });
      
      pill.querySelector('.wi_editor_link_pill_del').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        textarea._links.splice(idx, 1);
        refrescarEnlaces();
      });
      
      list.appendChild(pill);
    });
  };

  linksDiv.querySelector('.wi_editor_add_link_btn').addEventListener('click', (e) => {
    e.preventDefault();
    const labelInput = linksDiv.querySelector('.wi_editor_add_link_label');
    const urlInput = linksDiv.querySelector('.wi_editor_add_link_url');
    const label = labelInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!label || !url || url === 'https://') {
      Notificacion('Por favor completa ambos campos del enlace', 'warning');
      return;
    }
    
    textarea._links.push({ etiqueta: label, label: label, url: url });
    labelInput.value = '';
    urlInput.value = '';
    refrescarEnlaces();
    Notificacion('Enlace agregado', 'success');
  });

  // Lógica de Renderizado del Panel de Galería
  galleryDiv.innerHTML = `
    <div class="wi_editor_gallery_upload_zone">
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <span>Arrastra capturas aquí o haz clic para subir</span>
      <input type="file" class="wi_editor_gallery_file_input wi_editor_hidden_file_input" accept="image/*" multiple>
    </div>
    <div class="wi_editor_gallery_grid"></div>
  `;

  const refrescarGaleria = () => {
    const grid = galleryDiv.querySelector('.wi_editor_gallery_grid');
    grid.innerHTML = '';
    
    textarea._imagenes.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'wi_editor_gallery_item';
      
      item.innerHTML = `
        <img src="${img}" alt="Captura ${idx}">
        <button type="button" class="wi_editor_gallery_item_del" data-idx="${idx}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      
      // Al hacer clic en la X, se elimina la imagen de forma limpia
      item.querySelector('.wi_editor_gallery_item_del').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        textarea._imagenes.splice(idx, 1);
        
        // Re-indexar los marcadores en el texto del textarea
        let text = textarea.value;
        text = text.replace(new RegExp(`\\!\\[imagen\\]\\(${idx}\\)`, 'g'), '');
        for (let i = idx + 1; i <= textarea._imagenes.length; i++) {
          text = text.replace(new RegExp(`\\!\\[imagen\\]\\(${i}\\)`, 'g'), `![imagen](${i - 1})`);
        }
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        refrescarGaleria();
        Notificacion('Imagen eliminada de la galería', 'info');
      });
      
      grid.appendChild(item);
    });
  };

  const procesarArchivos = async (files) => {
    let agregadas = 0;
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const res = await comprimirImagen(file);
          textarea._imagenes.push(res.dataUrl);
          agregadas++;
        } catch (err) {
          Notificacion(err.message, 'warning');
        }
      }
    }
    if (agregadas > 0) {
      refrescarGaleria();
      Notificacion(`${agregadas} imagen(es) agregada(s) a la galería`, 'success');
    }
  };

  const dropZone = galleryDiv.querySelector('.wi_editor_gallery_upload_zone');
  const fileInput = galleryDiv.querySelector('.wi_editor_gallery_file_input');
  
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => procesarArchivos(e.target.files));
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    procesarArchivos(e.dataTransfer.files);
  });

  // Interceptar evento de pegado en el contenedor para soportar pegados en Galería y Editor (Ctrl + V)
  container.addEventListener('paste', async (e) => {
    // Si el usuario está escribiendo en los inputs del formulario de enlaces, dejar pasar el pegado nativo de texto
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && (active.classList.contains('wi_editor_add_link_label') || active.classList.contains('wi_editor_add_link_url') || active.classList.contains('wi_editor_modal_input'))) {
      return;
    }

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let files = [];
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      let agregadas = [];
      for (let file of files) {
        try {
          const res = await comprimirImagen(file);
          textarea._imagenes.push(res.dataUrl);
          const idx = textarea._imagenes.length - 1;
          agregadas.push(`![imagen](${idx})`);
        } catch (err) {
          Notificacion(err.message, 'warning');
        }
      }
      if (agregadas.length > 0) {
        refrescarGaleria();
        
        // Si la pestaña de edición (textarea) está activa, insertar el marcador en el texto
        if (!textarea.classList.contains('wi_editor_hidden')) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          const replacement = agregadas.join('\n');
          textarea.value = text.substring(0, start) + replacement + text.substring(end);
          textarea.focus();
          textarea.setSelectionRange(start + replacement.length, start + replacement.length);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          Notificacion('Imagen pegada e insertada en el editor', 'success');
        } else {
          // Si estamos en la pestaña de Galería, solo agregamos a la colección
          Notificacion('Imagen agregada a la galería', 'success');
        }
      }
    }
  });

  // Lógica de conmutación de pestañas con Clases CSS (Cero estilos inline)
  tabEdit.addEventListener('click', () => {
    tabEdit.classList.add('active');
    tabLinks.classList.remove('active');
    tabGallery.classList.remove('active');
    tabPreview.classList.remove('active');
    
    textarea.classList.remove('wi_editor_hidden');
    linksDiv.classList.add('wi_editor_hidden');
    galleryDiv.classList.add('wi_editor_hidden');
    previewDiv.classList.add('wi_editor_hidden');
    
    formatButtonsLeft.classList.remove('wi_editor_disabled_toolbar');
    textarea.focus();
  });

  tabLinks.addEventListener('click', () => {
    tabLinks.classList.add('active');
    tabEdit.classList.remove('active');
    tabGallery.classList.remove('active');
    tabPreview.classList.remove('active');
    
    textarea.classList.add('wi_editor_hidden');
    linksDiv.classList.remove('wi_editor_hidden');
    galleryDiv.classList.add('wi_editor_hidden');
    previewDiv.classList.add('wi_editor_hidden');
    
    formatButtonsLeft.classList.add('wi_editor_disabled_toolbar');
    refrescarEnlaces();
  });

  tabGallery.addEventListener('click', () => {
    tabGallery.classList.add('active');
    tabEdit.classList.remove('active');
    tabLinks.classList.remove('active');
    tabPreview.classList.remove('active');
    
    textarea.classList.add('wi_editor_hidden');
    linksDiv.classList.add('wi_editor_hidden');
    galleryDiv.classList.remove('wi_editor_hidden');
    previewDiv.classList.add('wi_editor_hidden');
    
    formatButtonsLeft.classList.add('wi_editor_disabled_toolbar');
    refrescarGaleria();
    galleryDiv.focus(); // Enfocar la sección de galería para permitir pegado inmediato (Ctrl+V)
  });

  tabPreview.addEventListener('click', () => {
    tabPreview.classList.add('active');
    tabEdit.classList.remove('active');
    tabLinks.classList.remove('active');
    tabGallery.classList.remove('active');
    
    // 1. Compilar markdown traduciendo ![imagen](idx) a su Base64 real
    let mdContent = textarea.value;
    mdContent = mdContent.replace(/\!\[imagen\]\((\d+)\)/g, (match, idx) => {
      const index = parseInt(idx, 10);
      const imgBase64 = textarea._imagenes[index];
      if (imgBase64) {
        return `![imagen](${imgBase64})`;
      }
      return match;
    });
    
    let htmlContent = wiMd(mdContent);
    
    // 2. Renderizar subsección de Galería al final
    let galleryHtml = '';
    if (textarea._imagenes && textarea._imagenes.length > 0) {
      galleryHtml = `
        <div class="wi_editor_preview_section">
          <div class="wi_editor_preview_title">
            <i class="fa-solid fa-images"></i> Capturas del Caso (${textarea._imagenes.length})
          </div>
          <div class="wi_editor_preview_gallery">
            ${textarea._imagenes.map((img, idx) => `
              <img src="${img}" class="wi_editor_preview_gallery_img" alt="Captura ${idx}">
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // 3. Renderizar subsección de Enlaces al final
    let linksHtml = '';
    if (textarea._links && textarea._links.length > 0) {
      linksHtml = `
        <div class="wi_editor_preview_section">
          <div class="wi_editor_preview_title">
            <i class="fa-solid fa-circle-info"></i> Enlaces de Apoyo
          </div>
          <div class="wi_editor_preview_links">
            ${textarea._links.map(lnk => `
              <a href="${lnk.url}" target="_blank" class="wi_editor_preview_link_btn">
                <i class="fa-solid fa-link"></i> ${lnk.etiqueta || lnk.label || 'Enlace'}
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    previewDiv.innerHTML = htmlContent + galleryHtml + linksHtml;
    
    textarea.classList.add('wi_editor_hidden');
    linksDiv.classList.add('wi_editor_hidden');
    galleryDiv.classList.add('wi_editor_hidden');
    previewDiv.classList.remove('wi_editor_hidden');
    
    formatButtonsLeft.classList.add('wi_editor_disabled_toolbar');
  });

  // Escuchar atajos Ctrl+B y Ctrl+I
  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        aplicarFormato(textarea, 'bold');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        aplicarFormato(textarea, 'italic');
      }
    }
  });

  // Asignar listeners a los botones de la toolbar
  toolbar.querySelectorAll('.wi_editor_toolbar_btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const format = btn.getAttribute('data-format');
      if (!format) return;

      if (format === 'image-insert') {
        abrirInsertImgModal(textarea);
      } else if (format === 'link') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const textInput = document.getElementById('wi_editor_link_text');
        const urlInput = document.getElementById('wi_editor_link_url');
        
        if (textInput) textInput.value = selectedText || '';
        if (urlInput) urlInput.value = 'https://';

        const submitBtn = document.getElementById('wi_editor_link_submit');
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        newSubmitBtn.addEventListener('click', () => {
          const linkText = textInput.value.trim();
          const linkUrl = urlInput.value.trim();

          if (!linkText || !linkUrl || linkUrl === 'https://') {
            Notificacion('Por favor completa ambos campos del enlace', 'warning');
            return;
          }

          aplicarFormato(textarea, 'link', { text: linkText, url: linkUrl });
          cerrarModal('wi_editor_link_modal');
        });

        abrirModal('wi_editor_link_modal');
      } else {
        aplicarFormato(textarea, format);
      }
    });
  });
};

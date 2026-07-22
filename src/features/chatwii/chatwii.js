// src/features/chatwii/visual.js - Orquestador visual de ChatWii (Asistente de IA en Windows)
import { crearVentanaChat, crearModalConfirmacion } from '@features/chatwii/components/chat.js';
import {
  initCoach,
  enviarMensaje,
  obtenerHistorial,
  limpiarHistorial,
  obtenerSaludo,
  agregarMensajeLocalAlHistorial
} from './brain.js';
import { Mensaje, abrirModal, cerrarModal, getls, savels, wicopy } from '@widev';
import { contieneCodigoProhibido, estaBloqueadoTemporalmente, registrarIntentoBloqueo, obtenerTiempoBloqueoRestante } from '@features/chatwii/lib/seguridad.js';
import { mdToHtml as parseMd, procesarHtml } from '@features/chatwii/lib/escribirmd.js';
import { inicializarDragDrop } from './lib/dragdrop.js';
import { inicializarGaleria } from './lib/galeria.js';
import { crearScrollInteligente } from './lib/scroll.js';
import './chatwii.css';

let _container = null;
let _enviando = false;
let _persona = null;
let _imagenesCargadas = [];
let _scrollHelper = null;
let _historialOffset = 0;
let _mensajeCitado = null;

const citarMensaje = (autor, texto) => {
  const replyBox = document.getElementById('cr_chat_reply_box');
  const replyAuthor = document.getElementById('cr_chat_reply_author');
  const replyText = document.getElementById('cr_chat_reply_text');
  const textarea = document.getElementById('cr_chat_textarea');

  if (!replyBox || !replyAuthor || !replyText) return;

  // Limpiar saltos de línea y sanitizar espacios de la cita (Fase 3.4)
  let textoLimpio = texto.replace(/\n+/g, ' ').trim();
  if (textoLimpio.length > 80) {
    textoLimpio = textoLimpio.substring(0, 77) + '...';
  }

  _mensajeCitado = { autor, texto: textoLimpio };

  replyAuthor.textContent = autor === 'Tú' ? 'Respondiendo a ti mismo:' : 'Respondiendo a ChatWii:';
  replyText.textContent = textoLimpio;
  replyBox.style.display = 'flex';

  if (textarea) {
    textarea.focus();
  }
};

/**
 * Obtiene el handle de ventana del app compatible con Tauri v1 y v2
 */
const obtenerVentana = () => {
  if (window.__TAURI__) {
    // Intentar API de Tauri v2 (WebviewWindow)
    if (window.__TAURI__.webviewWindow) {
      return window.__TAURI__.webviewWindow.getCurrentWebviewWindow();
    }
    // Fallback a API de Tauri v1 (Window)
    if (window.__TAURI__.window) {
      return window.__TAURI__.window.getCurrentWindow();
    }
  }
  return null;
};

/**
 * Convierte un texto markdown extendido a HTML usando el parser premium escribirmd
 */
const mdToHtml = (txt) => {
  const html = parseMd(txt);
  return procesarHtml(html);
};

const actualizarEstadoBotonEnviar = () => {
  const textarea = document.getElementById('cr_chat_textarea');
  const btnSend = document.getElementById('cr_chat_btn_send');
  if (btnSend && textarea) {
    btnSend.disabled = textarea.value.trim().length === 0 && _imagenesCargadas.length === 0;
  }
};

const renderizarPrevisualizaciones = () => {
  const container = document.getElementById('cr_chat_image_previews');
  if (!container) return;

  container.innerHTML = _imagenesCargadas.map((img, index) => `
    <div class="cr_chat_preview_thumb">
      <img src="${img.base64}" alt="Previsualización" />
      <button class="cr_chat_preview_remove" data-index="${index}" title="Quitar imagen">&times;</button>
    </div>
  `).join('');

  container.querySelectorAll('.cr_chat_preview_remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      _imagenesCargadas.splice(idx, 1);
      renderizarPrevisualizaciones();
      actualizarEstadoBotonEnviar();
    });
  });
};

/**
 * Agrega una burbuja de mensaje al área de chat
 */
const agregarBurbuja = (role, contenido, scroll = true) => {
  const area = document.getElementById('cr_chat_mensajes_area');
  if (!area) return null;

  const burbuja = document.createElement('div');
  const classRole = role === 'user' ? 'user' : 'chatwii';
  burbuja.className = `cr_chat_burbuja ${classRole}`;

  // Contenedor del texto
  const textoDiv = document.createElement('div');
  textoDiv.className = 'cr_chat_texto';

  if (Array.isArray(contenido)) {
    contenido.forEach(part => {
      if (part.text) {
        const textSpan = document.createElement('div');
        if (role === 'model') {
          textSpan.innerHTML = mdToHtml(part.text);
        } else {
          if (part.text.trim().startsWith('>')) {
            textSpan.innerHTML = mdToHtml(part.text);
          } else {
            textSpan.textContent = part.text;
          }
        }
        textoDiv.appendChild(textSpan);
      } else if (part.inlineData) {
        const imgEl = document.createElement('img');
        imgEl.className = 'cr_chat_bubble_img';
        let srcVal = part.inlineData.data;
        if (srcVal && !srcVal.startsWith('data:')) {
          srcVal = `data:${part.inlineData.mimeType};base64,${srcVal}`;
        }
        imgEl.src = srcVal;
        textoDiv.appendChild(imgEl);
      }
    });
  } else {
    if (role === 'model') {
      textoDiv.innerHTML = mdToHtml(contenido);
    } else {
      if (typeof contenido === 'string' && contenido.trim().startsWith('>')) {
        textoDiv.innerHTML = mdToHtml(contenido);
      } else {
        textoDiv.textContent = contenido;
      }
    }
  }

  burbuja.appendChild(textoDiv);

  // Crear el botón flotante de respuesta/cita (WhatsApp-Style) (Fase 3.4)
  // Se agrega a todos los mensajes (incluso streaming) y lee el texto de forma dinámica en el click
  const btnReply = document.createElement('button');
  btnReply.className = 'cr_chat_btn_reply';
  btnReply.innerHTML = '<i class="fas fa-reply"></i>';
  btnReply.title = 'Responder';
  btnReply.addEventListener('click', (e) => {
    e.stopPropagation();
    const textoActual = textoDiv.innerText || textoDiv.textContent || '';
    citarMensaje(role === 'model' ? 'ChatWii' : 'Tú', textoActual);
  });
  burbuja.appendChild(btnReply);

  area.appendChild(burbuja);

  // Limitar los elementos activos en el DOM a 20 para reducir la RAM al mínimo (Fase 3.2)
  const limiteMensajesDOM = 20;
  const burbujasActuales = area.querySelectorAll('.cr_chat_burbuja');
  if (burbujasActuales.length > limiteMensajesDOM) {
    const primerMensaje = burbujasActuales[0];
    if (primerMensaje) {
      primerMensaje.remove();
      _historialOffset++;
      
      // Asegurarse de que el botón de paginación exista al inicio
      if (!document.getElementById('cr_btn_cargar_anteriores')) {
        const btnCargar = document.createElement('div');
        btnCargar.id = 'cr_btn_cargar_anteriores';
        btnCargar.className = 'cr_chat_paginacion';
        btnCargar.textContent = '[ Cargar mensajes anteriores ]';
        area.insertBefore(btnCargar, area.firstChild);
        btnCargar.addEventListener('click', () => {
          cargarMensajesAnteriores();
        });
      }
    }
  }

  if (scroll) {
    if (_scrollHelper) {
      _scrollHelper.autoScroll(true);
    } else {
      area.scrollTop = area.scrollHeight;
    }
  }
  return burbuja;
};

/**
 * Agrega el indicador de escritura ("Typing...")
 */
const agregarBurbujaStreaming = () => {
  const area = document.getElementById('cr_chat_mensajes_area');
  if (!area) return null;

  const burbuja = document.createElement('div');
  burbuja.className = 'cr_chat_burbuja chatwii cr_chat_msg_streaming';
  
  const textoDiv = document.createElement('div');
  textoDiv.className = 'cr_chat_texto';
  textoDiv.innerHTML = `
    <span class="cr_typing_dot"></span>
    <span class="cr_typing_dot"></span>
    <span class="cr_typing_dot"></span>
  `;
  
  burbuja.appendChild(textoDiv);
  area.appendChild(burbuja);
  if (_scrollHelper) {
    _scrollHelper.autoScroll(true);
  } else {
    area.scrollTop = area.scrollHeight;
  }
  return burbuja;
};

/**
 * Renderiza el historial completo del chat
 */
export const renderHistorialChat = () => {
  const area = document.getElementById('cr_chat_mensajes_area');
  if (!area) return;
  area.innerHTML = '';

  const hist = obtenerHistorial();
  if (hist.length === 0) {
    // Mostrar saludo con animación
    const skeletonBurbuja = agregarBurbujaStreaming();

    setTimeout(() => {
      if (!skeletonBurbuja) {
        agregarBurbuja('model', obtenerSaludo(), true);
        return;
      }
      const txtDiv = skeletonBurbuja.querySelector('.cr_chat_texto');
      if (txtDiv) {
        txtDiv.innerHTML = mdToHtml(obtenerSaludo());
        skeletonBurbuja.classList.remove('cr_chat_msg_streaming');
      }
      if (_scrollHelper) {
        _scrollHelper.autoScroll(true);
      } else {
        area.scrollTop = area.scrollHeight;
      }
    }, 500);

    return;
  }

  // Paginación activa: mostrar los últimos 20 mensajes al inicio
  const limiteMensajes = 20;
  if (hist.length > limiteMensajes) {
    _historialOffset = hist.length - limiteMensajes;
    
    // Crear el botón de paginación
    const btnCargar = document.createElement('div');
    btnCargar.id = 'cr_btn_cargar_anteriores';
    btnCargar.className = 'cr_chat_paginacion';
    btnCargar.textContent = '[ Cargar mensajes anteriores ]';
    area.appendChild(btnCargar);
    
    btnCargar.addEventListener('click', () => {
      cargarMensajesAnteriores();
    });
  } else {
    _historialOffset = 0;
  }

  const visibles = hist.slice(_historialOffset);
  visibles.forEach(msg => {
    agregarBurbuja(msg.role, msg.parts, false);
  });

  if (_scrollHelper) {
    _scrollHelper.autoScroll(true);
  } else {
    area.scrollTop = area.scrollHeight;
  }
};

const cargarMensajesAnteriores = () => {
  const area = document.getElementById('cr_chat_mensajes_area');
  const btnCargar = document.getElementById('cr_btn_cargar_anteriores');
  if (!area) return;

  const hist = obtenerHistorial();
  const limiteMensajes = 20;
  
  const nuevoOffset = Math.max(0, _historialOffset - limiteMensajes);
  const anteriores = hist.slice(nuevoOffset, _historialOffset);
  _historialOffset = nuevoOffset;

  if (btnCargar) btnCargar.remove();

  const oldScrollHeight = area.scrollHeight;
  const oldScrollTop = area.scrollTop;

  area.innerHTML = '';

  if (_historialOffset > 0) {
    const nuevoBtn = document.createElement('div');
    nuevoBtn.id = 'cr_btn_cargar_anteriores';
    nuevoBtn.className = 'cr_chat_paginacion';
    nuevoBtn.textContent = '[ Cargar mensajes anteriores ]';
    area.appendChild(nuevoBtn);
    
    nuevoBtn.addEventListener('click', () => {
      cargarMensajesAnteriores();
    });
  }

  const visibles = hist.slice(_historialOffset);
  visibles.forEach(msg => {
    agregarBurbuja(msg.role, msg.parts, false);
  });

  const diffHeight = area.scrollHeight - oldScrollHeight;
  area.scrollTop = oldScrollTop + diffHeight;
};

/**
 * Envía el mensaje y gestiona el streaming y lectura de pantalla
 */
const procesarEnvioMensaje = async () => {
  if (_enviando) return;

  const textarea = document.getElementById('cr_chat_textarea');
  const btnSend = document.getElementById('cr_chat_btn_send');
  if (!textarea) return;

  const texto = textarea.value.trim();
  const tieneTexto = texto.length > 0;
  const tieneImagenes = _imagenesCargadas.length > 0;

  if (!tieneTexto && !tieneImagenes) return;

  // --- INTERCEPTAR COMANDOS LOCALES DE MÚSICA (Fase 3.2 - Optimizado) ---
  const textoLimpioLocal = texto.toLowerCase().trim();
  let esComandoLocal = false;
  let respuestaComandoLocal = '';
  
  // Comandos fijos exactos
  const comandosMusicaFijos = /^(reproducir|play|pausar|pause|siguiente|next|anterior|prev|atras|repetir|loop|bucle)$/i;
  
  // Comandos variables (deben tener la palabra musica/música y una palabra de acción)
  const hasMusicaWord = /\b(musica|música)\b/i.test(textoLimpioLocal);
  const hasActionWord = /\b(play|reproducir|pausar|pause|stop|parar|siguiente|next|anterior|prev|atras|loop|bucle|repetir)\b/i.test(textoLimpioLocal);

  if (comandosMusicaFijos.test(textoLimpioLocal)) {
    esComandoLocal = true;
    if (window.wiMusica) {
      if (/^(reproducir|play)$/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.play();
      } else if (/^(pausar|pause)$/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.pause();
      } else if (/^(siguiente|next)$/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.next();
      } else if (/^(anterior|prev|atras)$/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.prev();
      } else if (/^(repetir|loop|bucle)$/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.toggleLoop();
      }
    } else {
      respuestaComandoLocal = 'El reproductor de música no está listo en este momento.';
    }
  } else if (hasMusicaWord && hasActionWord) {
    esComandoLocal = true;
    if (window.wiMusica) {
      if (/\b(play|reproducir)\b/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.play();
      } else if (/\b(pausar|pause|stop|parar)\b/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.pause();
      } else if (/\b(siguiente|next)\b/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.next();
      } else if (/\b(anterior|prev|atras)\b/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.prev();
      } else if (/\b(loop|bucle|repetir)\b/i.test(textoLimpioLocal)) {
        respuestaComandoLocal = window.wiMusica.toggleLoop();
      }
    } else {
      respuestaComandoLocal = 'El reproductor de música no está listo en este momento.';
    }
  }

  if (esComandoLocal) {
    agregarBurbuja('user', [{ text: texto }], true);
    agregarBurbuja('model', `¡Claro, amigo! He ejecutado la acción de música: **${respuestaComandoLocal}**`, true);
    
    agregarMensajeLocalAlHistorial(texto, `¡Claro, amigo! He ejecutado la acción de música: **${respuestaComandoLocal}**`);
    
    textarea.value = '';
    textarea.style.height = 'auto';
    _enviando = false;
    textarea.focus();
    return;
  }

  // Validar bloqueo temporal de seguridad
  if (estaBloqueadoTemporalmente()) {
    const tiempoRestante = obtenerTiempoBloqueoRestante();
    Mensaje(`Chat bloqueado por seguridad durante 24 horas. Restante: ${tiempoRestante}.`, 'error');
    return;
  }

  // Validar inyección de código prohibido
  if (contieneCodigoProhibido(texto)) {
    Mensaje('Entrada inválida: Contiene comandos prohibidos.', 'error');
    registrarIntentoBloqueo();
    return;
  }

  _enviando = true;

  // Detectar comando de captura de pantalla por lenguaje natural
  const pideVer = /\b(captura|captura\s+pantalla|captura\s+imagen)\b/i.test(texto);

  if (btnSend) btnSend.disabled = true;
  textarea.disabled = true;

  // Copiar imágenes cargadas y limpiar cola local
  const imagenesAEnviar = [..._imagenesCargadas];
  _imagenesCargadas = [];

  // Procesar Captura de Pantalla nativa en Rust si se solicita
  if (pideVer) {
    try {
      Mensaje('📸 Capturando pantalla...', 'info');
      // Invocar comando de captura de Tauri Rust
      const base64Img = await window.__TAURI__.core.invoke('capturar_pantalla');
      imagenesAEnviar.push({
        mime: 'image/webp',
        base64: base64Img
      });
      Mensaje('📸 Pantalla capturada con éxito.', 'success');
    } catch (e) {
      console.error('Error al capturar pantalla:', e);
      Mensaje('Error al tomar captura de pantalla nativa.', 'error');
    }
  }

  // Limpiar input y restaurar estado
  textarea.disabled = false;
  textarea.value = '';
  textarea.style.height = 'auto';
  
  const previewsContainer = document.getElementById('cr_chat_image_previews');
  if (previewsContainer) previewsContainer.innerHTML = '';

  // Construir el prompt final considerando citas (Fase 3.4)
  let promptFinal = texto;
  if (_mensajeCitado) {
    promptFinal = `> **${_mensajeCitado.autor} dijo:** "${_mensajeCitado.texto.trim()}"\n\n${texto}`;
    _mensajeCitado = null;
    const replyBox = document.getElementById('cr_chat_reply_box');
    if (replyBox) replyBox.style.display = 'none';
  }

  // Pintar el mensaje del usuario en la UI
  const userParts = [];
  imagenesAEnviar.forEach(img => {
    const cleanBase64 = img.base64.split(',')[1] || img.base64;
    userParts.push({
      inlineData: {
        mimeType: img.mime,
        data: cleanBase64
      }
    });
  });
  if (texto) {
    userParts.push({ text: promptFinal });
  }

  agregarBurbuja('user', userParts, true);

  // Pintar burbuja de carga de respuesta (Typing...)
  const bubbleStreaming = agregarBurbujaStreaming();

  try {
    let streamingContainer = null;
    let streamText = '';

    await enviarMensaje(promptFinal, imagenesAEnviar, (chunk) => {
      // Remover indicador "Typing..." al recibir el primer chunk
      if (bubbleStreaming && bubbleStreaming.parentNode) {
        bubbleStreaming.remove();
      }

      if (!streamingContainer) {
        // Crear la burbuja de streaming definitiva
        streamingContainer = agregarBurbuja('model', '', true);
      }

      streamText += chunk;
      const cleanText = streamText.replace(/\[MUSIC:(PLAY|PAUSE|NEXT|PREV|LOOP|SEARCH)(?::([^\]]+))?\]/gi, '').trim();
      const txtDiv = streamingContainer.querySelector('.cr_chat_texto');
      if (txtDiv) {
        txtDiv.innerHTML = mdToHtml(cleanText);
      }
      
      if (_scrollHelper) {
        _scrollHelper.autoScroll();
      } else {
        const area = document.getElementById('cr_chat_mensajes_area');
        if (area) area.scrollTop = area.scrollHeight;
      }
    });

    // Limpieza final de etiquetas en la burbuja
    const finalCleanText = streamText.replace(/\[MUSIC:(PLAY|PAUSE|NEXT|PREV|LOOP|SEARCH)(?::([^\]]+))?\]/gi, '').trim();
    if (streamingContainer) {
      const txtDiv = streamingContainer.querySelector('.cr_chat_texto');
      if (txtDiv) {
        txtDiv.innerHTML = mdToHtml(finalCleanText);
      }

      // --- EJECUCIÓN DE COMANDOS DE MÚSICA EN CALIENTE ---
      try {
        const matches = [...streamText.matchAll(/\[MUSIC:(PLAY|PAUSE|NEXT|PREV|LOOP|SEARCH)(?::([^\]]+))?\]/gi)];
        matches.forEach(m => {
          const cmd = m[1].toUpperCase();
          const arg = m[2];
          
          if (window.wiMusica) {
            if (cmd === 'PLAY') {
              if (arg) {
                window.wiMusica.playTrack(arg);
              } else {
                window.wiMusica.play();
              }
            } else if (cmd === 'PAUSE') {
              window.wiMusica.pause();
            } else if (cmd === 'NEXT') {
              window.wiMusica.next();
            } else if (cmd === 'PREV') {
              window.wiMusica.prev();
            } else if (cmd === 'SEARCH' && arg) {
              window.wiMusica.buscar(arg);
            }
          }
        });
      } catch (cmdErr) {
        console.error('Error al ejecutar comando de música desde ChatWii:', cmdErr);
      }
    } else {
      if (bubbleStreaming && bubbleStreaming.parentNode) {
        bubbleStreaming.remove();
      }
      agregarBurbuja('model', '⚠️ La respuesta de la IA llegó vacía. Por favor, comprueba tu conexión de red o que tu Gemini API Key en Ajustes sea válida.', true);
    }
  } catch (error) {
    console.error('Error al enviar mensaje a Gemini:', error);
    if (bubbleStreaming) bubbleStreaming.remove();
    agregarBurbuja('model', `⚠️ Error al conectar con Gemini: ${error.message || error}`);
  } finally {
    _enviando = false;
    textarea.focus();
  }
};

/**
 * Inicializa y acopla los listeners y el DOM del Chat
 */
export async function iniciarVisualChat(containerId, persona) {
  _container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!_container) return;

  _persona = persona;
  const idioma = 'es'; // Español por defecto

  // Inyectar el Widget de Chat en el contenedor
  _container.innerHTML = '';
  _container.appendChild(crearVentanaChat(persona));

  // Inyectar el modal de confirmación de limpieza (remover previo para evitar duplicados)
  const prevModal = document.getElementById('chat_confirm');
  if (prevModal) prevModal.remove();
  document.body.appendChild(crearModalConfirmacion(idioma));

  // Cargar historial inicial de brain.js
  await initCoach();
  renderHistorialChat();

  // Inicializar Drag & Drop
  const chatWidget = document.getElementById('chat_nuevo');
  if (chatWidget) {
    inicializarDragDrop(chatWidget, (img) => {
      _imagenesCargadas.push(img);
      renderizarPrevisualizaciones();
      actualizarEstadoBotonEnviar();
    });
  }

  // Inicializar visor de galería premium
  inicializarGaleria();

  // Inicializar scroll inteligente
  const messagesArea = document.getElementById('cr_chat_mensajes_area');
  if (messagesArea) {
    _scrollHelper = crearScrollInteligente(messagesArea);
  }

  // Delegación de clic para botones de copiado de código block, citas e inline code usando wicopy
  messagesArea?.addEventListener('click', (e) => {
    // 1. Clic en botón "Copiar" de bloques de código
    const btn = e.target.closest('.chatwii-codeblock-copy');
    if (btn) {
      const codeId = btn.getAttribute('data-code-id');
      const codeEl = document.getElementById(codeId);
      if (codeEl) {
        const codeText = codeEl.innerText || codeEl.textContent;
        wicopy(codeText, btn, '¡Copiado!');
      }
      return;
    }

    // 2. Clic sobre citas (blockquote) para copiado rápido
    const blockquote = e.target.closest('blockquote');
    if (blockquote) {
      const text = blockquote.innerText || blockquote.textContent;
      wicopy(text, blockquote, '¡Cita copiada!');
      return;
    }

    // 3. Clic sobre código inline (code sin editable) para copiado rápido
    const inlineCode = e.target.closest('code:not([contenteditable])');
    if (inlineCode) {
      const text = inlineCode.innerText || inlineCode.textContent;
      wicopy(text, inlineCode, '¡Código copiado!');
      return;
    }
  });

  // --- REGISTRO DE EVENTOS Y ACCIONES ---
  const textarea = document.getElementById('cr_chat_textarea');
  const btnSend = document.getElementById('cr_chat_btn_send');

  // Ajustar altura del textarea dinámicamente
  textarea?.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    actualizarEstadoBotonEnviar();
  });

  // Abrir explorador de archivos al dar click al botón Plus
  const btnAttach = document.getElementById('cr_chat_btn_attach');
  const fileInput = document.getElementById('cr_chat_file_input');
  
  btnAttach?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          _imagenesCargadas.push({
            base64: event.target.result,
            mime: file.type
          });
          renderizarPrevisualizaciones();
          actualizarEstadoBotonEnviar();
        };
        reader.readAsDataURL(file);
      }
    });
    fileInput.value = '';
  });

  // Pegar imágenes directamente desde el portapapeles (Ctrl+V)
  textarea?.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          _imagenesCargadas.push({
            base64: event.target.result,
            mime: file.type
          });
          renderizarPrevisualizaciones();
          actualizarEstadoBotonEnviar();
        };
        reader.readAsDataURL(file);
      }
    }
  });

  // Enviar mensaje con la tecla Enter (sin Shift)
  textarea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      procesarEnvioMensaje();
    }
  });

  // Botón enviar
  btnSend?.addEventListener('click', procesarEnvioMensaje);

  // Botón Nuevo Chat (Inicia nueva conversación directamente)
  const btnNuevo = document.getElementById('cr_chat_btn_nuevo');
  btnNuevo?.addEventListener('click', async () => {
    await limpiarHistorial();
    renderHistorialChat();
    Mensaje('Nueva conversación iniciada.', 'success');
  });

  // Botón Exportar Historial en Markdown (.md)
  const btnExportar = document.getElementById('cr_chat_btn_exportar');
  btnExportar?.addEventListener('click', () => {
    const historial = obtenerHistorial();
    if (!historial || historial.length === 0) {
      Mensaje('No hay mensajes para exportar', 'warning');
      return;
    }

    const perfil = getls('wiSmile');
    const nombreUsuario = perfil ? `${perfil.nombre} ${perfil.apellidos}`.trim() : 'Usuario';
    const fecha = new Date().toLocaleString();

    let markdown = `# Historial de Conversación con Pancitawii Asistente\n\n`;
    markdown += `**Usuario:** ${nombreUsuario}\n`;
    markdown += `**Fecha de Exportación:** ${fecha}\n\n`;
    markdown += `*Este documento contiene la conversación mantenida con Pancitawii.*\n\n`;
    markdown += `---\n\n`;

    historial.forEach((msg) => {
      const roleLabel = msg.role === 'user' ? `👤 **Tú**` : `🧘 **Pancitawii**`;
      
      let text = '';
      if (Array.isArray(msg.parts)) {
        text = msg.parts
          .map(p => {
            if (p.text) return p.text;
            if (p.inlineData) return `[Imagen adjunta]`;
            return '';
          })
          .join('\n');
      }

      markdown += `### ${roleLabel}\n\n${text}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `historial_chatwii_${timestamp}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Mensaje('Historial exportado con éxito', 'success');
  });

  // Botón Limpiar Chat (Abre el modal de confirmación)
  const btnLimpiar = document.getElementById('cr_chat_btn_limpiar');
  btnLimpiar?.addEventListener('click', () => {
    abrirModal('chat_confirm');
  });

  // Botón Confirmar Limpieza dentro del modal
  const btnConfirmClear = document.getElementById('cr_chat_btn_confirm_clear');
  btnConfirmClear?.addEventListener('click', async () => {
    await limpiarHistorial();
    renderHistorialChat();
    cerrarModal('chat_confirm');
    Mensaje('Historial de conversación borrado.', 'success');
  });

  // Botón Cancelar Limpieza dentro del modal
  const btnCancelClear = document.getElementById('cr_chat_btn_cancel_clear');
  btnCancelClear?.addEventListener('click', () => {
    cerrarModal('chat_confirm');
  });

  // Botón cerrar previsualización de respuesta (Fase 3.4)
  const btnCloseReply = document.getElementById('cr_btn_close_reply');
  btnCloseReply?.addEventListener('click', () => {
    const replyBox = document.getElementById('cr_chat_reply_box');
    if (replyBox) replyBox.style.display = 'none';
    _mensajeCitado = null;
  });
}

// Punto de arranque para Pancitawii router
import { coachPersona } from './personalidad.js';

export function arrancar(container) {
  if (container._cleanupChatWii) {
    container._cleanupChatWii();
  }

  iniciarVisualChat(container, coachPersona);

  container._cleanupChatWii = () => {
    if (_scrollHelper) {
      _scrollHelper.desacoplar();
    }
    const modal = document.getElementById('chat_confirm');
    if (modal) modal.remove();
  };
}

// src/features/horario/horario.js
// Módulo de Horario Semanal Interactivo (Sin Parpadeo, Matriz Unificada Gap 0, Toggle de Edición con --mco y @widev witip)

import { wiTip, wiSelect, wiSugerencias } from '@widev';
import { horarioDB } from './lib/horario_db.js';
import { obtenerBloqueActual, horaAMinutos, formatearDuracion } from './lib/horario_dev.js';
import './horario.css';

let liveTimer = null;
let tabActiva = 'preview'; // 'preview' | 'editar'
let diaActivoEdit = 'Lunes';
let bloqueEditandoId = null;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const TABS = [
  { id: 'preview', label: 'Vista Previa', icon: 'fa-eye', position: 'left', active: true },
  { id: 'editar', label: 'Editar', icon: 'fa-pen-to-square', position: 'left' },
  { id: 'actualizar_horario', label: 'Actualizar', icon: 'fa-rotate', position: 'right', iconOnly: true }
];

/**
 * Traduce variables CSS del tema a formato Hexadecimal para el input[type="color"]
 */
function obtenerHexDeColor(col) {
  if (!col) return '#1978d7';
  if (col.startsWith('#')) return col;
  
  const mapa = {
    'var(--oro)': '#FFDA34',
    'var(--cielo)': '#0EBEFF',
    'var(--paz)': '#29C72E',
    'var(--mora)': '#7000FF',
    'var(--mco)': '#1978d7',
    'var(--dulce)': '#FF5C69'
  };
  return mapa[col] || '#1978d7';
}

/**
 * Determina dinámicamente si un color es claro para aplicar contraste de texto oscuro
 */
function esColorClaro(hex) {
  if (!hex) return false;
  let cleanHex = hex;
  if (hex.startsWith('var(')) {
    const mapa = {
      'var(--oro)': true,
      'var(--cielo)': false,
      'var(--paz)': false,
      'var(--mora)': false,
      'var(--mco)': false,
      'var(--dulce)': false
    };
    return !!mapa[hex];
  }
  
  if (cleanHex.startsWith('#')) {
    cleanHex = cleanHex.slice(1);
  }
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return false;
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180;
}

/**
 * Recopila una lista única de sugerencias mezclando actividades predeterminadas y las guardadas en la base de datos local.
 * @param {Array} horario Lista de bloques actual
 * @returns {Array} Listado de sugerencias de texto
 */
function obtenerSugerenciasDinamicas(horario) {
  const defaults = [
    "Estudio 📘",
    "Trabajo 💼",
    "Comer 🍽️",
    "Alistarse 🎒",
    "Desayuno 🥞",
    "Cena 🍕",
    "Dormir 🌙",
    "Paseo / Deporte 🚴",
    "Clase de Matemáticas 📐"
  ];
  const guardados = horario.map(b => b.titulo).filter(Boolean);
  return [...new Set([...defaults, ...guardados])];
}

export function arrancar(container) {
  let typeSelectControl = null;
  let sugerenciasControl = null;
  let daySelectControl = null;

  // Limpiar listeners y timers previos si existen
  if (container._cleanupHorario) {
    container._cleanupHorario();
  }

  const handleSubtabChange = (e) => {
    if (e.detail.subtabId === 'preview' || e.detail.subtabId === 'editar') {
      tabActiva = e.detail.subtabId;
      if (!e.detail.keepId) {
        bloqueEditandoId = null;
      }
      render();
    }
  };

  const handleSubtabAction = (e) => {
    if (e.detail.actionId === 'actualizar_horario') {
      render();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'F5') {
      e.preventDefault();
      render();
      const btnActualizar = document.querySelector('[data-action-id="actualizar_horario"]');
      if (btnActualizar) {
        wiTip(btnActualizar, 'Horario actualizado', 'top', 1500);
      }
    }
  };

  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);
  document.addEventListener('keydown', handleKeyDown);

  container._cleanupHorario = () => {
    if (liveTimer) clearInterval(liveTimer);
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
    document.removeEventListener('keydown', handleKeyDown);
    if (typeSelectControl) {
      typeSelectControl.destroy();
      typeSelectControl = null;
    }
    if (sugerenciasControl) {
      sugerenciasControl.destroy();
      sugerenciasControl = null;
    }
    if (daySelectControl) {
      daySelectControl.destroy();
      daySelectControl = null;
    }
  };

  const render = () => {
    // Destruir instancias anteriores para prevenir memory leaks
    if (typeSelectControl) {
      typeSelectControl.destroy();
      typeSelectControl = null;
    }
    if (sugerenciasControl) {
      sugerenciasControl.destroy();
      sugerenciasControl = null;
    }
    if (daySelectControl) {
      daySelectControl.destroy();
      daySelectControl = null;
    }

    const horario = horarioDB.obtenerHorario();
    const bloqueActual = obtenerBloqueActual(horario);

    container.innerHTML = `
      <div class="horario_container">
        <!-- Banner de Estado en Vivo (Sección Inicial) -->
        <div class="horario_live_status">
          <div class="horario_live_status_left">
            <i class="fa-solid fa-circle-play"></i>
            <span class="live_status_title">AHORA MISMO: ${bloqueActual.titulo} (${bloqueActual.horaInicio} - ${bloqueActual.horaFin})</span>
          </div>
          <div class="horario_live_status_right">
            <span>⏳ Tiempo restante: <strong class="live_status_time">${bloqueActual.tiempoRestanteStr}</strong></span>
          </div>
        </div>

        <!-- Pestaña Activa -->
        <div class="horario_body_content">
          ${tabActiva === 'preview' ? renderVistaPrevia(horario, bloqueActual) : renderVistaEditar(horario)}
        </div>
      </div>
    `;

    // ── CONFIGURACIÓN DE VISTA PREVIA (MODO LECTURA) ──────────────────────
    if (tabActiva === 'preview') {
      // La vista previa ahora es estrictamente de lectura. No se vinculan clics para editar.
    }

    // ── CONFIGURACIÓN DE VISTA EDICIÓN ────────────────────────────────────
    if (tabActiva === 'editar') {
      const inpStart = container.querySelector('#horario_inp_hora_inicio');
      const inpEnd = container.querySelector('#horario_inp_hora_fin');
      const inpTitle = container.querySelector('#horario_inp_titulo');
      const inpColor = container.querySelector('#horario_inp_color');
      const selType = container.querySelector('#horario_sel_tipo');
      const selDia = container.querySelector('#horario_sel_dia');
      const durEl = container.querySelector('#horario_lbl_duracion');

      // Función para recalcular duración en vivo
      const recalcularYValidar = () => {
        if (!inpStart || !inpEnd) return;
        const sVal = inpStart.value;
        const eVal = inpEnd.value;
        if (!sVal || !eVal) return;

        const sMin = horaAMinutos(sVal);
        let eMin = horaAMinutos(eVal);
        if (eMin < sMin) eMin += 24 * 60; // cruce de medianoche

        const diff = eMin - sMin;
        if (durEl) {
          durEl.textContent = `(${formatearDuracion(diff)})`;
        }
      };

      // Inicializar select premium wiSelect en Día
      if (selDia) {
        daySelectControl = wiSelect(selDia, {
          placeholder: 'Selecciona día...',
          searchPlaceholder: 'Buscar...',
          onChange: (val) => {
            diaActivoEdit = val;
          }
        });
        if (diaActivoEdit) {
          daySelectControl.setValue(diaActivoEdit);
        }
      }

      // Inicializar select premium wiSelect en Tipo y enlazar colores por defecto
      if (selType) {
        typeSelectControl = wiSelect(selType, {
          placeholder: 'Selecciona tipo...',
          searchPlaceholder: 'Buscar...',
          onChange: (val) => {
            recalcularYValidar();
            // Asignar color por defecto al selector si el usuario no tiene cargado uno de edición
            if (!bloqueEditandoId && inpColor) {
              const coloresDefault = {
                fijo: '#FFDA34',      // var(--oro)
                flexible: '#0EBEFF',  // var(--cielo)
                estudio: '#1978d7',   // var(--mco)
                dormir: '#7000FF'     // var(--mora)
              };
              if (coloresDefault[val]) {
                inpColor.value = coloresDefault[val];
              }
            }
          }
        });
      }

      // Inicializar Autocompletado inteligente wiSugerencias en Título
      if (inpTitle) {
        sugerenciasControl = wiSugerencias(inpTitle, {
          sugerencias: () => obtenerSugerenciasDinamicas(horarioDB.obtenerHorario()),
          maxResultados: 6,
          onSelect: () => {
            recalcularYValidar();
          }
        });
      }

      // Si estamos en modo edición, rellenar el formulario con los datos del bloque seleccionado
      if (bloqueEditandoId) {
        const itemEdit = horario.find(b => b.id === bloqueEditandoId);
        if (itemEdit) {
          if (inpStart) inpStart.value = itemEdit.horaInicio;
          if (inpEnd) inpEnd.value = itemEdit.horaFin;
          if (inpTitle) inpTitle.value = itemEdit.titulo;
          if (inpColor) inpColor.value = obtenerHexDeColor(itemEdit.color);
          
          if (typeSelectControl) {
            typeSelectControl.setValue(itemEdit.tipo);
          } else if (selType) {
            selType.value = itemEdit.tipo;
          }

          if (daySelectControl) {
            daySelectControl.setValue(itemEdit.dia);
            diaActivoEdit = itemEdit.dia;
          }
        }
      }

      // Registrar listeners para cambios en tiempo real
      if (inpStart) inpStart.addEventListener('input', recalcularYValidar);
      if (inpEnd) inpEnd.addEventListener('input', recalcularYValidar);
      if (inpTitle) inpTitle.addEventListener('input', recalcularYValidar);
      if (selType) selType.addEventListener('change', recalcularYValidar);

      // Calcular inicialmente al entrar a la pestaña editar
      recalcularYValidar();

      // Guardar / Registrar Bloque
      const formAgregar = container.querySelector('#horario_form_agregar_bloque');
      if (formAgregar) {
        formAgregar.addEventListener('submit', (e) => {
          e.preventDefault();
          const horaInicio = inpStart?.value;
          const horaFin = inpEnd?.value;
          const titulo = inpTitle?.value;
          const color = inpColor?.value || 'var(--mco)';
          const tipo = typeSelectControl ? typeSelectControl.getValue() : (selType?.value || 'fijo');
          const dia = daySelectControl ? daySelectControl.getValue() : diaActivoEdit;

          if (horaInicio && horaFin && titulo) {
            const listaActual = horarioDB.obtenerHorario();

            if (bloqueEditandoId) {
              // Actualizar bloque existente
              const index = listaActual.findIndex(b => b.id === bloqueEditandoId);
              if (index !== -1) {
                listaActual[index] = {
                  ...listaActual[index],
                  dia,
                  horaInicio,
                  horaFin,
                  titulo,
                  tipo,
                  color
                };
                horarioDB.guardarHorario(listaActual);
              }
              bloqueEditandoId = null;
            } else {
              // Agregar nuevo bloque
              const nuevoBloque = {
                dia,
                horaInicio,
                horaFin,
                titulo,
                tipo,
                color
              };
              horarioDB.agregarBloque(nuevoBloque);
            }

            render();
          }
        });
      }

      // Botón Cancelar en el Formulario
      const btnCancel = container.querySelector('#horario_btn_cancelar_edit');
      if (btnCancel) {
        btnCancel.addEventListener('click', () => {
          bloqueEditandoId = null;
          render();
        });
      }

      // Botón Eliminar en el Formulario
      const btnDelete = container.querySelector('#horario_btn_eliminar_edit');
      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          if (bloqueEditandoId) {
            horarioDB.eliminarBloque(bloqueEditandoId);
            bloqueEditandoId = null;
            render();
          }
        });
      }

      // ── VINCULAR EVENTOS CLIC EN LA TABLA DEL EDITOR ──────────────────────
      container.querySelectorAll('.horario_table_planilla_ed .horario_td_actividad_ed').forEach(td => {
        td.addEventListener('click', () => {
          const id = td.getAttribute('data-id');
          const dia = td.getAttribute('data-dia');
          if (id) {
            bloqueEditandoId = id;
            diaActivoEdit = dia;
            render();
          }
        });
      });

      container.querySelectorAll('.horario_table_planilla_ed .horario_td_vacio_ed').forEach(td => {
        td.addEventListener('click', () => {
          const dia = td.getAttribute('data-dia');
          const inicio = td.getAttribute('data-inicio');
          const fin = td.getAttribute('data-fin');

          bloqueEditandoId = null;
          diaActivoEdit = dia;
          render();

          // Rellenar las horas en el formulario recién renderizado
          const inpStartNew = container.querySelector('#horario_inp_hora_inicio');
          const inpEndNew = container.querySelector('#horario_inp_hora_fin');
          if (inpStartNew) inpStartNew.value = inicio;
          if (inpEndNew) inpEndNew.value = fin;

          // Actualizar el indicador visual de duración
          const durElNew = container.querySelector('#horario_lbl_duracion');
          if (durElNew) {
            const sMin = horaAMinutos(inicio);
            let eMin = horaAMinutos(fin);
            if (eMin < sMin) eMin += 24 * 60;
            durElNew.textContent = `(${formatearDuracion(eMin - sMin)})`;
          }
        });
      });
    }

    // Activar/Vincular todos los tooltips de wiTip en el DOM generado
    wiTip();
  };

  render();

  // Actualizar estado en vivo cada 30 segundos de forma segura
  liveTimer = setInterval(() => {
    const liveEl = container.querySelector('.horario_live_status');
    if (liveEl) {
      const horario = horarioDB.obtenerHorario();
      const bActual = obtenerBloqueActual(horario);
      const titleEl = liveEl.querySelector('.live_status_title');
      const timeEl = liveEl.querySelector('.live_status_time');
      if (titleEl) {
        titleEl.textContent = `AHORA MISMO: ${bActual.titulo} (${bActual.horaInicio} - ${bActual.horaFin})`;
      }
      if (timeEl) {
        timeEl.textContent = bActual.tiempoRestanteStr;
      }
    }
  }, 30000);
}

function renderVistaPrevia(horario, bloqueActual) {
  const diasInglesEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const nombreHoy = diasInglesEsp[new Date().getDay()];

  // 1. Extraer y ordenar dinámicamente todos los intervalos de tiempo únicos
  const slotsMap = new Map();
  horario.forEach(b => {
    const key = `${b.horaInicio}-${b.horaFin}`;
    if (!slotsMap.has(key)) {
      slotsMap.set(key, { inicio: b.horaInicio, fin: b.horaFin });
    }
  });
  const slots = Array.from(slotsMap.values());
  slots.sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));

  return `
    <table class="horario_table_planilla">
      <thead>
        <tr>
          <th class="horario_th_cond">Cond.</th>
          <th class="horario_th_hora">Hour</th>
          ${DIAS_SEMANA.map(d => `
            <th class="horario_th_dia ${d === nombreHoy ? 'horario_th_hoy' : ''}">
              ${d}
              ${d === nombreHoy ? '<span class="horario_hoy_badge">HOY</span>' : ''}
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${slots.map(slot => {
          // Filtrar bloques en este slot específico
          const bloquesEnSlot = horario.filter(b => b.horaInicio === slot.inicio && b.horaFin === slot.fin);
          const esFijo = bloquesEnSlot.some(b => b.tipo === 'fijo');

          return `
            <tr>
              <td class="horario_td_cond">
                ${esFijo ? '<span class="horario_badge_fijo">FIJO</span>' : ''}
              </td>
              <td class="horario_td_hora">
                <div class="horario_time_start">${slot.inicio}</div>
                <div class="horario_time_end">${slot.fin}</div>
              </td>
              ${DIAS_SEMANA.map(dia => {
                const b = bloquesEnSlot.find(item => item.dia === dia);
                const esActivo = b && b.id && bloqueActual && b.id === bloqueActual.id;

                if (b) {
                  const cl = esColorClaro(b.color);
                  return `
                    <td class="horario_td_actividad ${esActivo ? 'horario_bloque_activo' : ''} ${cl ? 'horario_color_claro' : ''}" 
                        style="--bloque-color: ${b.color || 'var(--mco)'}" 
                        data-id="${b.id}"
                        data-dia="${dia}"
                        data-witip="${b.dia}: ${b.titulo} (${b.horaInicio} - ${b.horaFin})">
                      ${esActivo ? '<span class="horario_live_dot"></span>' : ''}
                      <div class="horario_actividad_titulo">${b.titulo}</div>
                      <div class="horario_actividad_subbadge">${b.tipo.toUpperCase()}</div>
                    </td>
                  `;
                } else {
                  return `
                    <td class="horario_td_vacio ${dia === nombreHoy ? 'horario_col_hoy_vacio' : ''}"
                        data-dia="${dia}"
                        data-inicio="${slot.inicio}"
                        data-fin="${slot.fin}"
                        data-witip="Libre: ${dia} (${slot.inicio} - ${slot.fin})">
                    </td>
                  `;
                }
              }).join('')}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderVistaPreviaEditar(horario, bloqueActual) {
  const diasInglesEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const nombreHoy = diasInglesEsp[new Date().getDay()];

  const slotsMap = new Map();
  horario.forEach(b => {
    const key = `${b.horaInicio}-${b.horaFin}`;
    if (!slotsMap.has(key)) {
      slotsMap.set(key, { inicio: b.horaInicio, fin: b.horaFin });
    }
  });
  const slots = Array.from(slotsMap.values());
  slots.sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));

  return `
    <table class="horario_table_planilla_ed">
      <thead>
        <tr>
          <th class="horario_th_cond_ed">Cond.</th>
          <th class="horario_th_hora_ed">Hour</th>
          ${DIAS_SEMANA.map(d => `
            <th class="horario_th_dia_ed ${d === nombreHoy ? 'horario_th_hoy_ed' : ''}">
              ${d}
              ${d === nombreHoy ? '<span class="horario_hoy_badge_ed">HOY</span>' : ''}
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${slots.map(slot => {
          const bloquesEnSlot = horario.filter(b => b.horaInicio === slot.inicio && b.horaFin === slot.fin);
          const esFijo = bloquesEnSlot.some(b => b.tipo === 'fijo');

          return `
            <tr>
              <td class="horario_td_cond_ed">
                ${esFijo ? '<span class="horario_badge_fijo_ed">FIJO</span>' : ''}
              </td>
              <td class="horario_td_hora_ed">
                <div class="horario_time_start_ed">${slot.inicio}</div>
                <div class="horario_time_end_ed">${slot.fin}</div>
              </td>
              ${DIAS_SEMANA.map(dia => {
                const b = bloquesEnSlot.find(item => item.dia === dia);
                const esActivo = b && b.id && bloqueActual && b.id === bloqueActual.id;
                const esEditando = b && b.id && b.id === bloqueEditandoId;

                if (b) {
                  const cl = esColorClaro(b.color);
                  return `
                    <td class="horario_td_actividad_ed ${esActivo ? 'horario_bloque_activo_ed' : ''} ${esEditando ? 'horario_bloque_editando_ed' : ''} ${cl ? 'horario_color_claro' : ''}" 
                        style="--bloque-color: ${b.color || 'var(--mco)'}" 
                        data-id="${b.id}"
                        data-dia="${dia}"
                        data-witip="${b.dia}: ${b.titulo} (${b.horaInicio} - ${b.horaFin}) ${esEditando ? '(Editando actualmente)' : '(Haz clic para editar)'}">
                      ${esActivo ? '<span class="horario_live_dot_ed"></span>' : ''}
                      <div class="horario_actividad_titulo_ed">${b.titulo}</div>
                      <div class="horario_actividad_subbadge_ed">${b.tipo.toUpperCase()}</div>
                    </td>
                  `;
                } else {
                  return `
                    <td class="horario_td_vacio_ed ${dia === nombreHoy ? 'horario_col_hoy_vacio_ed' : ''}"
                        data-dia="${dia}"
                        data-inicio="${slot.inicio}"
                        data-fin="${slot.fin}"
                        data-witip="Libre: ${dia} (${slot.inicio} - ${slot.fin}) (Haz clic para agregar bloque)">
                    </td>
                  `;
                }
              }).join('')}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderVistaEditar(horario) {
  return `
    <div class="horario_editor_box">
      <!-- Formulario para Agregar / Editar Bloque -->
      <form class="horario_form_agregar_bloque" id="horario_form_agregar_bloque">
        
        <!-- Campo Día como wiSelect Dropdown Premium -->
        <div class="horario_form_field">
          <label>Día</label>
          <select id="horario_sel_dia">
            <option value="Lunes">Lunes</option>
            <option value="Martes">Martes</option>
            <option value="Miércoles">Miércoles</option>
            <option value="Jueves">Jueves</option>
            <option value="Viernes">Viernes</option>
            <option value="Sábado">Sábado</option>
            <option value="Domingo">Domingo</option>
          </select>
        </div>

        <div class="horario_form_field">
          <label>Hora Inicio</label>
          <input type="time" id="horario_inp_hora_inicio" required value="08:00" data-witip="Hora en que empieza la actividad" />
        </div>
        <div class="horario_form_field">
          <label>Hora Fin <span id="horario_lbl_duracion" class="horario_form_lbl_duracion">(1h)</span></label>
          <input type="time" id="horario_inp_hora_fin" required value="09:00" data-witip="Hora en que termina la actividad" />
        </div>
        <div class="horario_form_field horario_form_field_wide">
          <label>Actividad / Título</label>
          <input type="text" id="horario_inp_titulo" placeholder="Ej: Clase de Matemáticas 📐" required data-witip="Escribe el título o selecciona una sugerencia" />
        </div>
        <div class="horario_form_field">
          <label>Tipo</label>
          <select id="horario_sel_tipo">
            <option value="fijo">Fijo (Obligatorio)</option>
            <option value="flexible">Flexible</option>
            <option value="estudio">Estudio</option>
            <option value="dormir">Dormir</option>
          </select>
        </div>
        
        <!-- Input Color Picker Premium -->
        <div class="horario_form_field_color">
          <label>Color</label>
          <input type="color" id="horario_inp_color" value="#0EBEFF" data-witip="Elige el color para identificar este bloque" />
        </div>

        <div class="horario_form_actions">
          <button type="submit" class="horario_btn_agregar_submit icon_only" data-witip="${bloqueEditandoId ? 'Guardar Cambios' : 'Agregar Actividad'}">
            <i class="fa-solid ${bloqueEditandoId ? 'fa-floppy-disk' : 'fa-plus'}"></i>
          </button>
          ${bloqueEditandoId ? `
            <button type="button" class="horario_btn_cancelar_edit icon_only" id="horario_btn_cancelar_edit" data-witip="Cancelar edición y limpiar">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <button type="button" class="horario_btn_eliminar_edit icon_only" id="horario_btn_eliminar_edit" data-witip="Eliminar este bloque">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      </form>

      <!-- Tabla Planilla Semanal Interactiva en la propia Vista de Edición -->
      <div class="horario_editor_planilla_container">
        ${renderVistaPreviaEditar(horario, obtenerBloqueActual(horario))}
      </div>
    </div>
  `;
}

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
  let presetsSugerenciasControl = null;
  let sugerenciasControl = null;

  // Limpiar listeners y timers previos si existen
  if (container._cleanupHorario) {
    container._cleanupHorario();
  }

  const handleSubtabChange = (e) => {
    if (e.detail.subtabId === 'preview' || e.detail.subtabId === 'editar') {
      tabActiva = e.detail.subtabId;
      bloqueEditandoId = null;
      render();
    }
  };

  const handleSubtabAction = (e) => {
    if (e.detail.actionId === 'actualizar_horario') {
      render();
    }
  };

  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);

  container._cleanupHorario = () => {
    if (liveTimer) clearInterval(liveTimer);
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
    if (typeSelectControl) {
      typeSelectControl.destroy();
      typeSelectControl = null;
    }
    if (presetsSugerenciasControl) {
      presetsSugerenciasControl.destroy();
      presetsSugerenciasControl = null;
    }
    if (sugerenciasControl) {
      sugerenciasControl.destroy();
      sugerenciasControl = null;
    }
  };

  const render = () => {
    // Destruir instancias anteriores para prevenir memory leaks
    if (typeSelectControl) {
      typeSelectControl.destroy();
      typeSelectControl = null;
    }
    if (presetsSugerenciasControl) {
      presetsSugerenciasControl.destroy();
      presetsSugerenciasControl = null;
    }
    if (sugerenciasControl) {
      sugerenciasControl.destroy();
      sugerenciasControl = null;
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
          ${tabActiva === 'preview' ? renderVistaPrevia(horario) : renderVistaEditar(horario)}
        </div>
      </div>
    `;

    // 2. Eventos en Pestaña Editar
    if (tabActiva === 'editar') {
      const inpStart = container.querySelector('#horario_inp_hora_inicio');
      const inpEnd = container.querySelector('#horario_inp_hora_fin');
      const inpTitle = container.querySelector('#horario_inp_titulo');
      const inpPresets = container.querySelector('#horario_inp_presets');
      const selType = container.querySelector('#horario_sel_tipo');
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

      // Inicializar select premium wiSelect en Tipo
      if (selType) {
        typeSelectControl = wiSelect(selType, {
          placeholder: 'Selecciona tipo...',
          searchPlaceholder: 'Buscar...',
          onChange: (val) => {
            recalcularYValidar();
          }
        });
      }

      // Inicializar Autocompletado wiSugerencias para Presets Rápidos
      if (inpPresets) {
        const presetLabels = ["Estudio 📘", "Trabajo 💼", "Comer 🥞", "Dormir 🌙", "Relax 🎬"];
        presetsSugerenciasControl = wiSugerencias(inpPresets, {
          sugerencias: presetLabels,
          maxResultados: 5,
          onSelect: (val) => {
            const presetData = {
              "Estudio 📘": { tit: "Estudio 📘", tipo: "estudio", dur: 60 },
              "Trabajo 💼": { tit: "Trabajo 💼", tipo: "fijo", dur: 480 },
              "Comer 🥞": { tit: "Comer 🥞", tipo: "flexible", dur: 45 },
              "Dormir 🌙": { tit: "Dormir 🌙", tipo: "dormir", dur: 480 },
              "Relax 🎬": { tit: "Tiempo Libre / Relax 🎬", tipo: "flexible", dur: 60 }
            };

            const info = presetData[val];
            if (info) {
              if (inpTitle) inpTitle.value = info.tit;
              
              if (typeSelectControl) {
                typeSelectControl.setValue(info.tipo);
              } else if (selType) {
                selType.value = info.tipo;
              }

              if (inpStart && inpEnd) {
                const sVal = inpStart.value || '08:00';
                const sMin = horaAMinutos(sVal);
                let eMin = sMin + info.dur;
                if (eMin >= 24 * 60) eMin -= 24 * 60;

                const pad = (n) => String(n).padStart(2, '0');
                const h = Math.floor(eMin / 60);
                const m = eMin % 60;
                inpEnd.value = `${pad(h)}:${pad(m)}`;
              }

              recalcularYValidar();
            }

            // Limpiar la casilla visual del preset para que vuelva a su placeholder
            setTimeout(() => {
              if (inpPresets) {
                inpPresets.value = '';
              }
            }, 150);
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
          
          if (typeSelectControl) {
            typeSelectControl.setValue(itemEdit.tipo);
          } else if (selType) {
            selType.value = itemEdit.tipo;
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

      // Cambiar de día en el editor
      container.querySelectorAll('.horario_dia_pill').forEach(pill => {
        pill.addEventListener('click', () => {
          diaActivoEdit = pill.getAttribute('data-dia');
          bloqueEditandoId = null;
          render();
        });
      });

      // Guardar / Registrar Bloque
      const formAgregar = container.querySelector('#horario_form_agregar_bloque');
      if (formAgregar) {
        formAgregar.addEventListener('submit', (e) => {
          e.preventDefault();
          const horaInicio = inpStart?.value;
          const horaFin = inpEnd?.value;
          const titulo = inpTitle?.value;
          const tipo = typeSelectControl ? typeSelectControl.getValue() : (selType?.value || 'fijo');

          if (horaInicio && horaFin && titulo) {
            const coloresMap = {
              fijo: 'var(--oro)',
              flexible: 'var(--cielo)',
              estudio: 'var(--mco)',
              dormir: 'var(--mora)'
            };

            const listaActual = horarioDB.obtenerHorario();

            if (bloqueEditandoId) {
              // Actualizar bloque existente
              const index = listaActual.findIndex(b => b.id === bloqueEditandoId);
              if (index !== -1) {
                listaActual[index] = {
                  ...listaActual[index],
                  dia: diaActivoEdit,
                  horaInicio,
                  horaFin,
                  titulo,
                  tipo,
                  color: coloresMap[tipo] || 'var(--mco)'
                };
                horarioDB.guardarHorario(listaActual);
              }
              bloqueEditandoId = null;
            } else {
              // Agregar nuevo bloque
              const nuevoBloque = {
                dia: diaActivoEdit,
                horaInicio,
                horaFin,
                titulo,
                tipo,
                color: coloresMap[tipo] || 'var(--mco)'
              };
              horarioDB.agregarBloque(nuevoBloque);
            }

            render();
          }
        });
      }

      // Evento Toggle Editar Bloque (Primer clic activa, Segundo clic cancela y limpia)
      container.querySelectorAll('.horario_bloque_btn_edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (bloqueEditandoId === id) {
            // Toggle Off: Cancelar edición y limpiar selección
            bloqueEditandoId = null;
          } else {
            // Toggle On: Seleccionar bloque para editar
            bloqueEditandoId = id;
          }
          render();
        });
      });

      // Evento Eliminar Bloque
      container.querySelectorAll('.horario_bloque_btn_delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (id) {
            horarioDB.eliminarBloque(id);
            if (bloqueEditandoId === id) bloqueEditandoId = null;
            render();
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

function renderVistaPrevia(horario) {
  const bloqueActual = obtenerBloqueActual(horario);
  const diasInglesEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const nombreHoy = diasInglesEsp[new Date().getDay()];

  return `
    <div class="horario_preview_grid">
      ${DIAS_SEMANA.map(dia => {
        const esHoy = dia === nombreHoy;
        const bloquesDia = horario.filter(b => b.dia === dia);
        return `
          <div class="horario_dia_column ${esHoy ? 'horario_dia_hoy' : ''}">
            <div class="horario_dia_column_header">
              ${dia}
              ${esHoy ? '<span class="horario_hoy_badge">HOY</span>' : ''}
            </div>
            ${bloquesDia.length > 0 ? bloquesDia.map(b => {
              const esActivo = b.id && bloqueActual && b.id === bloqueActual.id;
              return `
                <div class="horario_bloque_card_preview ${esActivo ? 'horario_bloque_activo' : ''}" style="--bloque-color: ${b.color || 'var(--mco)'}" data-witip="${b.dia}: ${b.titulo} (${b.horaInicio} - ${b.horaFin})">
                  ${esActivo ? '<span class="horario_live_badge"><span class="horario_live_dot"></span>EN VIVO</span>' : ''}
                  <div class="horario_bloque_hora">${b.horaInicio} - ${b.horaFin}</div>
                  <div class="horario_bloque_titulo">${b.titulo}</div>
                  <div class="horario_bloque_tipo_badge">
                    ${b.tipo === 'fijo' ? '<i class="fa-solid fa-lock"></i> FIJO' : '<i class="fa-solid fa-unlock"></i> FLEXIBLE'}
                  </div>
                </div>
              `;
            }).join('') : '<p class="hr_dia_libre_text">Día Libre</p>'}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderVistaEditar(horario) {
  const bloquesDia = horario.filter(b => b.dia === diaActivoEdit);

  return `
    <div class="horario_editor_box">
      <!-- Selector de Días -->
      <div class="horario_editor_top_bar">
        <div class="horario_editor_selector_dias">
          ${DIAS_SEMANA.map(d => `
            <button class="horario_dia_pill ${d === diaActivoEdit ? 'active' : ''}" data-dia="${d}" data-witip="Ver bloques del ${d}">${d}</button>
          `).join('')}
        </div>
      </div>

      <!-- Formulario para Agregar / Editar Bloque -->
      <form class="horario_form_agregar_bloque" id="horario_form_agregar_bloque">
        
        <!-- Presets Rápidos en input autocomplete de wiSugerencias -->
        <div class="horario_form_field">
          <label>Cargar Actividad</label>
          <input type="text" id="horario_inp_presets" placeholder="Selecciona una plantilla..." data-witip="Escribe o selecciona un preset rápido" />
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

        <button type="submit" class="horario_btn_agregar_submit" data-witip="Registrar o guardar cambios en tu horario">
          <i class="fa-solid ${bloqueEditandoId ? 'fa-floppy-disk' : 'fa-plus'}"></i> ${bloqueEditandoId ? 'Guardar Cambios' : 'Agregar'}
        </button>
      </form>

      <!-- Lista de Bloques del Día Activo con Toggle de Editar y Eliminar -->
      <div class="horario_editor_lista_bloques">
        <h4 class="hr_modal_subtitle">
          Bloques configurados para el ${diaActivoEdit}:
        </h4>
        ${bloquesDia.length > 0 ? bloquesDia.map(b => {
          const isEditingThis = b.id === bloqueEditandoId;
          return `
            <div class="horario_bloque_editor_row">
              <div class="horario_bloque_editor_info">
                <span class="horario_bloque_editor_time"><i class="fa-regular fa-clock"></i> ${b.horaInicio} - ${b.horaFin}</span>
                <span class="horario_bloque_editor_title">${b.titulo}</span>
                <span class="horario_bloque_tipo_badge horario_bloque_tipo_badge_spacing">
                  ${b.tipo === 'fijo' ? '<i class="fa-solid fa-lock"></i> FIJO' : '<i class="fa-solid fa-unlock"></i> FLEXIBLE'}
                </span>
              </div>
              <div class="horario_bloque_action_btns">
                <button class="horario_bloque_btn_edit ${isEditingThis ? 'active' : ''}" data-id="${b.id}" data-witip="${isEditingThis ? 'Cancelar edición' : 'Editar este bloque'}">
                  <i class="fa-solid ${isEditingThis ? 'fa-xmark' : 'fa-pen'}"></i>
                </button>
                <button class="horario_bloque_btn_delete" data-id="${b.id}" data-witip="Eliminar este bloque de forma permanente">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          `;
        }).join('') : '<p class="hr_empty_bloques_text">No hay bloques asignados para este día.</p>'}
      </div>
    </div>
  `;
}

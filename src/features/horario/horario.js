// src/features/horario/horario.js
// Módulo de Horario Semanal Interactivo (Sin Parpadeo, Matriz Unificada Gap 0, Toggle de Edición con --mco y @widev witip)

import { wiTip } from '@widev';
import { horarioDB } from './lib/horario_db.js';
import { obtenerBloqueActual } from './lib/horario_dev.js';
import './horario.css';

let liveTimer = null;
let tabActiva = 'preview'; // 'preview' | 'editar'
let diaActivoEdit = 'Lunes';
let bloqueEditandoId = null;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const TABS = [
  { id: 'preview', label: 'Vista Previa', icon: 'fa-eye', position: 'left', active: true },
  { id: 'editar', label: 'Editar', icon: 'fa-pen-to-square', position: 'left' },
  { id: 'restaurar_horario', label: 'Restaurar', icon: 'fa-rotate-left', position: 'right', iconOnly: true }
];

export function arrancar(container) {
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
    if (e.detail.actionId === 'restaurar_horario') {
      horarioDB.restaurarPorDefecto();
      bloqueEditandoId = null;
      render();
    }
  };

  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);

  container._cleanupHorario = () => {
    if (liveTimer) clearInterval(liveTimer);
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
  };

  const render = () => {
    const horario = horarioDB.obtenerHorario();
    const bloqueActual = obtenerBloqueActual(horario);

    container.innerHTML = `
      <div class="horario_container">
        <!-- Banner de Estado en Vivo (Sección Inicial) -->
        <div class="horario_live_status">
          <div class="live_status_left">
            <i class="fa-solid fa-circle-play"></i>
            <span class="live_status_title">AHORA MISMO: ${bloqueActual.titulo} (${bloqueActual.horaInicio} - ${bloqueActual.horaFin})</span>
          </div>
          <div class="live_status_right">
            <span>⏳ Tiempo restante: <strong class="live_status_time">${bloqueActual.tiempoRestanteStr}</strong></span>
          </div>
        </div>

        <!-- Pestaña Activa -->
        <div class="horario_body_content">
          ${tabActiva === 'preview' ? renderVistaPrevia(horario) : renderVistaEditar(horario)}
        </div>
      </div>
    `;

    // 1. Activar Tooltips de wiTip
    wiTip();

    // 2. Eventos en Pestaña Editar
    if (tabActiva === 'editar') {
      // Si estamos en modo edición, rellenar el formulario con los datos del bloque seleccionado
      if (bloqueEditandoId) {
        const itemEdit = horario.find(b => b.id === bloqueEditandoId);
        if (itemEdit) {
          const inpStart = container.querySelector('#inp_hora_inicio');
          const inpEnd = container.querySelector('#inp_hora_fin');
          const inpTitle = container.querySelector('#inp_titulo');
          const selType = container.querySelector('#sel_tipo');
          if (inpStart) inpStart.value = itemEdit.horaInicio;
          if (inpEnd) inpEnd.value = itemEdit.horaFin;
          if (inpTitle) inpTitle.value = itemEdit.titulo;
          if (selType) selType.value = itemEdit.tipo;
        }
      }

      container.querySelectorAll('.dia_pill').forEach(pill => {
        pill.addEventListener('click', () => {
          diaActivoEdit = pill.getAttribute('data-dia');
          bloqueEditandoId = null;
          render();
        });
      });

      const formAgregar = container.querySelector('#form_agregar_bloque');
      if (formAgregar) {
        formAgregar.addEventListener('submit', (e) => {
          e.preventDefault();
          const horaInicio = container.querySelector('#inp_hora_inicio')?.value;
          const horaFin = container.querySelector('#inp_hora_fin')?.value;
          const titulo = container.querySelector('#inp_titulo')?.value;
          const tipo = container.querySelector('#sel_tipo')?.value;

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
      container.querySelectorAll('.bloque_btn_edit').forEach(btn => {
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
      container.querySelectorAll('.bloque_btn_delete').forEach(btn => {
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
  return `
    <div class="horario_preview_grid">
      ${DIAS_SEMANA.map(dia => {
        const bloquesDia = horario.filter(b => b.dia === dia);
        return `
          <div class="dia_column">
            <div class="dia_column_header">${dia}</div>
            ${bloquesDia.length > 0 ? bloquesDia.map(b => `
              <div class="bloque_card_preview" style="--bloque-color: ${b.color || 'var(--mco)'}" data-witip="${b.dia}: ${b.titulo} (${b.horaInicio} - ${b.horaFin})">
                <div class="bloque_hora">${b.horaInicio} - ${b.horaFin}</div>
                <div class="bloque_titulo">${b.titulo}</div>
                <div class="bloque_tipo_badge">
                  ${b.tipo === 'fijo' ? '<i class="fa-solid fa-lock"></i> FIJO' : '<i class="fa-solid fa-unlock"></i> FLEXIBLE'}
                </div>
              </div>
            `).join('') : '<p class="hr_dia_libre_text">Día Libre</p>'}
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
      <div class="editor_top_bar">
        <div class="editor_selector_dias">
          ${DIAS_SEMANA.map(d => `
            <button class="dia_pill ${d === diaActivoEdit ? 'active' : ''}" data-dia="${d}">${d}</button>
          `).join('')}
        </div>
      </div>

      <!-- Formulario para Agregar / Editar Bloque -->
      <form class="form_agregar_bloque" id="form_agregar_bloque">
        <div class="form_field">
          <label>Hora Inicio</label>
          <input type="time" id="inp_hora_inicio" required value="08:00" />
        </div>
        <div class="form_field">
          <label>Hora Fin</label>
          <input type="time" id="inp_hora_fin" required value="09:00" />
        </div>
        <div class="form_field form_field_wide">
          <label>Actividad / Título</label>
          <input type="text" id="inp_titulo" placeholder="Ej: Clase de Matemáticas 📐" required />
        </div>
        <div class="form_field">
          <label>Tipo</label>
          <select id="sel_tipo">
            <option value="fijo">Fijo (Obligatorio)</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <button type="submit" class="btn_agregar_submit" data-witip="Guardar o actualizar bloque">
          <i class="fa-solid ${bloqueEditandoId ? 'fa-floppy-disk' : 'fa-plus'}"></i> ${bloqueEditandoId ? 'Guardar Cambios' : 'Agregar'}
        </button>
      </form>

      <!-- Lista de Bloques del Día Activo con Toggle de Editar y Eliminar -->
      <div class="editor_lista_bloques">
        <h4 class="hr_modal_subtitle">
          Bloques configurados para el ${diaActivoEdit}:
        </h4>
        ${bloquesDia.length > 0 ? bloquesDia.map(b => {
          const isEditingThis = b.id === bloqueEditandoId;
          return `
            <div class="bloque_editor_row">
              <div class="bloque_editor_info">
                <span class="bloque_editor_time"><i class="fa-regular fa-clock"></i> ${b.horaInicio} - ${b.horaFin}</span>
                <span class="bloque_editor_title">${b.titulo}</span>
                <span class="bloque_tipo_badge bloque_tipo_badge_spacing">
                  ${b.tipo === 'fijo' ? '<i class="fa-solid fa-lock"></i> FIJO' : '<i class="fa-solid fa-unlock"></i> FLEXIBLE'}
                </span>
              </div>
              <div class="bloque_action_btns">
                <button class="bloque_btn_edit ${isEditingThis ? 'active' : ''}" data-id="${b.id}" data-witip="${isEditingThis ? 'Cancelar edición' : 'Editar este bloque'}">
                  <i class="fa-solid ${isEditingThis ? 'fa-xmark' : 'fa-pen'}"></i>
                </button>
                <button class="bloque_btn_delete" data-id="${b.id}" data-witip="Eliminar este bloque">
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

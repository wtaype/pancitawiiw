// src/features/panel/componentes/horario.js
// Componente de Horario Interactivo (Estilo horario/) con Banner de Actividad Actual y Tarjetas Organizadas

const DEMO_HORARIO = [
  {
    id: 1,
    titulo: 'Evaluación Clínica y Diagnóstico',
    subtitulo: 'Módulo de Medicina Interna',
    horaInicio: '08:00',
    horaFin: '09:30',
    estado: 'completado', // 'en_curso' | 'proximo' | 'completado'
    categoria: 'Clase Magistral',
    aula: 'Aula 204'
  },
  {
    id: 2,
    titulo: 'Farmacología Aplicada',
    subtitulo: 'Revisión de Tratamientos y Dosis',
    horaInicio: '10:00',
    horaFin: '12:00',
    estado: 'en_curso',
    categoria: 'Laboratorio',
    aula: 'Lab Simulación'
  },
  {
    id: 3,
    titulo: 'Sesión Clínica y Rondas',
    subtitulo: 'Presentación de Casos Clínicos',
    horaInicio: '14:00',
    horaFin: '16:00',
    estado: 'proximo',
    categoria: 'Práctica',
    aula: 'Auditorio A'
  },
  {
    id: 4,
    titulo: 'Taller de Suturas y Emergencias',
    subtitulo: 'Procedimientos Clínicos Básicos',
    horaInicio: '16:30',
    horaFin: '18:00',
    estado: 'proximo',
    categoria: 'Taller',
    aula: 'Sala Quirúrgica'
  }
];

export function renderHorario() {
  const enCurso = DEMO_HORARIO.find(b => b.estado === 'en_curso') || DEMO_HORARIO[0];

  return `
    <div class="horario_card">
      <!-- Banner de Actividad Actual Destacada -->
      <div class="horario_current_banner">
        <div class="current_banner_left">
          <span class="current_live_tag"><span class="live_dot"></span> En curso ahora</span>
          <h4 class="current_banner_title">${enCurso.titulo}</h4>
          <span class="current_banner_sub"><i class="fa-solid fa-location-dot"></i> ${enCurso.aula} · ${enCurso.categoria}</span>
        </div>
        <div class="current_banner_right">
          <span class="current_time_badge">${enCurso.horaInicio} - ${enCurso.horaFin}</span>
        </div>
      </div>

      <div class="horario_header">
        <div class="horario_title_wrap">
          <i class="fa-solid fa-calendar-days"></i>
          <h3>Agenda del Día</h3>
        </div>
        <div class="horario_filter_tabs">
          <button class="horario_tab active" data-filter="todos">Todas</button>
          <button class="horario_tab" data-filter="en_curso">En curso</button>
          <button class="horario_tab" data-filter="proximo">Próximas</button>
        </div>
      </div>

      <div class="horario_timeline" id="horario_timeline_list">
        ${renderListaItems(DEMO_HORARIO, 'todos')}
      </div>
    </div>
  `;
}

function renderBadgeEstado(estado) {
  if (estado === 'en_curso') {
    return `<span class="badge_estado en_curso"><span class="live_dot"></span> En curso</span>`;
  }
  if (estado === 'proximo') {
    return `<span class="badge_estado proximo"><i class="fa-regular fa-clock"></i> Próximo</span>`;
  }
  return `<span class="badge_estado completado"><i class="fa-solid fa-check"></i> Completado</span>`;
}

function renderListaItems(items, filtro) {
  const filtrados = items.filter(item => {
    if (filtro === 'en_curso') return item.estado === 'en_curso';
    if (filtro === 'proximo') return item.estado === 'proximo';
    return true;
  });

  if (filtrados.length === 0) {
    return `
      <div class="horario_empty">
        <i class="fa-solid fa-calendar-check"></i>
        <p>No hay actividades programadas para este filtro.</p>
      </div>
    `;
  }

  return filtrados.map(item => `
    <div class="horario_item ${item.estado}">
      <div class="horario_item_time">
        <span class="time_start">${item.horaInicio}</span>
        <span class="time_sep">-</span>
        <span class="time_end">${item.horaFin}</span>
      </div>

      <div class="horario_item_content">
        <div class="horario_item_top">
          <span class="horario_categoria">${item.categoria}</span>
          ${renderBadgeEstado(item.estado)}
        </div>
        <h4 class="horario_item_title">${item.titulo}</h4>
        <p class="horario_item_sub">${item.subtitulo}</p>
        <div class="horario_item_footer">
          <span><i class="fa-solid fa-location-dot"></i> ${item.aula}</span>
        </div>
      </div>
    </div>
  `).join('');
}

export function bindHorarioEvents(container) {
  const tabs = container.querySelectorAll('.horario_tab');
  const listEl = container.querySelector('#horario_timeline_list');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filtro = tab.dataset.filter;
      if (listEl) {
        listEl.innerHTML = renderListaItems(DEMO_HORARIO, filtro);
      }
    });
  });
}

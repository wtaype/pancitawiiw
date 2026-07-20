// src/features/panel/componentes/horario.js
// Componente de Horario Interactivo (conectado en tiempo real a horarioDB de pancitawii)

import { horarioDB } from '../../horario/lib/horario_db.js';

function obtenerHorarioProcesado() {
  const lista = horarioDB.obtenerHorario();
  const ahora = new Date();
  const diasInglesEsp = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const diaHoy = diasInglesEsp[ahora.getDay()];
  const diaManana = diasInglesEsp[(ahora.getDay() + 1) % 7];
  const minsAhora = ahora.getHours() * 60 + ahora.getMinutes();

  // Filtrar bloques del día actual
  let bloquesHoy = lista.filter(b => b.dia === diaHoy);
  if (bloquesHoy.length === 0) bloquesHoy = lista;

  // Filtrar bloques de mañana
  let bloquesManana = lista.filter(b => b.dia === diaManana);

  let bloqueEnCurso = null;

  const itemsProcesados = bloquesHoy.map(b => {
    const [hI, mI] = (b.horaInicio || '00:00').split(':').map(Number);
    const [hF, mF] = (b.horaFin || '00:00').split(':').map(Number);
    const startMins = (hI || 0) * 60 + (mI || 0);
    let endMins = (hF || 0) * 60 + (mF || 0);
    if (endMins < startMins) endMins += 24 * 60; // Caso trasnoche

    let estado = 'proximo';
    let minsRestantes = 0;

    if (minsAhora >= startMins && minsAhora < endMins) {
      estado = 'en_curso';
      minsRestantes = endMins - minsAhora;
    } else if (minsAhora >= endMins) {
      estado = 'completado';
    }

    const itemProcesado = {
      ...b,
      estado,
      minsRestantes,
      categoria: b.tipo === 'fijo' ? 'Actividad Principal' : 'Flexible',
      aula: b.dia || 'Lunes'
    };

    if (estado === 'en_curso') {
      bloqueEnCurso = itemProcesado;
    }

    return itemProcesado;
  });

  const itemsMananaProcesados = bloquesManana.map(b => ({
    ...b,
    estado: 'proximo',
    minsRestantes: 0,
    categoria: b.tipo === 'fijo' ? 'Actividad Principal' : 'Flexible',
    aula: b.dia || 'Mañana'
  }));

  return { 
    items: itemsProcesados, 
    itemsManana: itemsMananaProcesados,
    enCurso: bloqueEnCurso || itemsProcesados[0] 
  };
}

export function renderHorario() {
  const { items, enCurso } = obtenerHorarioProcesado();
  const esActivoReal = enCurso && enCurso.estado === 'en_curso';

  const badgeBanner = esActivoReal 
    ? `<span class="current_live_tag"><span class="live_dot"></span> En curso (Restan ${enCurso.minsRestantes} min)</span>`
    : `<span class="current_live_tag"><i class="fa-solid fa-sparkles"></i> Siguiente Actividad</span>`;

  const aulaTexto = enCurso && enCurso.aula ? enCurso.aula : (enCurso && enCurso.dia ? enCurso.dia : 'Diario');
  const categoriaTexto = enCurso && enCurso.categoria ? enCurso.categoria : 'Modo Enfoque';

  return `
    <div class="horario_card">
      <!-- Banner de Actividad Actual / Siguiente -->
      <div class="horario_current_banner">
        <div class="current_banner_left">
          ${badgeBanner}
          <h4 class="current_banner_title">${enCurso ? enCurso.titulo : 'Planificación Diario 🌟'}</h4>
          <span class="current_banner_sub"><i class="fa-solid fa-location-dot"></i> ${aulaTexto} · ${categoriaTexto}</span>
        </div>
        <div class="current_banner_right">
          <span class="current_time_badge">${enCurso ? enCurso.horaInicio : '--:--'} - ${enCurso ? enCurso.horaFin : '--:--'}</span>
        </div>
      </div>

      <div class="horario_header">
        <div class="horario_title_wrap">
          <i class="fa-solid fa-calendar-days"></i>
          <h3>Agenda del Día</h3>
        </div>
        <div class="horario_filter_tabs">
          <button class="horario_tab active" data-filter="todos">Todos</button>
          <button class="horario_tab" data-filter="proximo">Próximos</button>
          <button class="horario_tab" data-filter="manana">Mañana</button>
          <button class="horario_tab" data-filter="en_curso">En curso</button>
        </div>
      </div>

      <div class="horario_timeline" id="horario_timeline_list">
        ${renderListaItems(items, 'todos')}
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

function renderListaItems(items, filtro, itemsManana = []) {
  let filtrados = items;

  if (filtro === 'en_curso') {
    filtrados = items.filter(item => item.estado === 'en_curso');
  } else if (filtro === 'proximo') {
    filtrados = items.filter(item => item.estado === 'proximo');
  } else if (filtro === 'manana') {
    filtrados = itemsManana;
  }

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
        <div class="horario_item_footer">
          <span><i class="fa-solid fa-location-dot"></i> ${item.aula || item.dia}</span>
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
        const { items, itemsManana } = obtenerHorarioProcesado();
        listEl.innerHTML = renderListaItems(items, filtro, itemsManana);
      }
    });
  });
}

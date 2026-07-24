// src/features/inicio/inicio.js
// Módulo de Inicio Asistente & Dashboard de Productividad (Con mensajes dinámicos inteligentes y barra de progreso)

import { saludoSmile, Saludar, fechaHoy, Capi } from '@widev';
import state from '../../core/state.js';
import { rutas } from '@core/rutas.js';
import { horarioDB } from '../horario/lib/horario_db.js';
import { obtenerBloqueActual } from '../horario/lib/horario_dev.js';
import { obtenerProgresoDia } from './lib/progreso.js';
import { obtenerMensajesInteligentes } from './lib/mensajes.js';
import './inicio.css';

let rolesTimer = null;
let animProgressFrameId = null;

export function limpiar() {
  if (rolesTimer) {
    clearInterval(rolesTimer);
    rolesTimer = null;
  }
  if (animProgressFrameId) {
    cancelAnimationFrame(animProgressFrameId);
    animProgressFrameId = null;
  }
}

export function arrancar(container) {
  // Limpiar temporizadores previos si existían
  limpiar();

  const hrs = new Date().getHours();
  const iconoSolLuna = hrs >= 6 && hrs < 18 ? 'fa-cloud-sun' : 'fa-moon';
  const saludoTag = `${saludoSmile().toUpperCase()}!`;
  const fechaTexto = fechaHoy();

  // Obtener bloque de actividad actual y mensajes dinámicos
  const listaHorario = horarioDB.obtenerHorario();
  const bloqueActual = obtenerBloqueActual(listaHorario);
  const mensajesEnVivo = obtenerMensajesInteligentes();

  const activeBlockHTML = bloqueActual
    ? `
      <div class="inicio_actividad_banner active hwi_item">
        <div class="actividad_banner_label"><i class="fa-solid fa-hourglass-half"></i> En curso ahora</div>
        <div class="actividad_banner_title">${bloqueActual.titulo}</div>
        <div class="actividad_banner_time">${bloqueActual.horaInicio} a ${bloqueActual.horaFin}</div>
      </div>
    `
    : `
      <div class="inicio_actividad_banner free hwi_item">
        <div class="actividad_banner_label"><i class="fa-solid fa-mug-hot"></i> Tiempo Libre</div>
        <div class="actividad_banner_title">¡Es momento de descansar o avanzar libremente!</div>
      </div>
    `;

  container.innerHTML = `
    <div class="inicio_container">
      <!-- Banner Hero de Bienvenida Refactorizado -->
      <div class="welcome_banner">
        <div class="welcome_top_bar">
          <div class="welcome_tag hwi_item">
            <i class="fa-solid fa-sparkles"></i> ${saludoTag}
          </div>
          <div class="welcome_icon_box hwi_item">
            <i class="fa-solid ${iconoSolLuna}"></i>
          </div>
        </div>

        <!-- Área de contenido Split: Información de productividad y rutina -->
        <div class="welcome_body_split hwi_item">
          <div class="welcome_left_side">
            <h1 class="welcome_user_greeting" id="welcome_user_greeting">¡Hola!</h1>
            <p class="welcome_motivation_quote" id="welcome_motivation_quote"></p>
          </div>
          <div class="welcome_right_side">
            ${activeBlockHTML}
          </div>
        </div>

        <!-- Progreso del Día -->
        <div class="inicio_progress_container hwi_item">
          <div class="inicio_progress_info">
            <span class="inicio_progress_label"><i class="fa-solid fa-chart-line"></i> Progreso del Día</span>
            <span class="inicio_progress_pct" id="inicio_progress_pct">0%</span>
          </div>
          <div class="inicio_progress_bar">
            <div class="inicio_progress_fill" id="inicio_progress_fill"></div>
          </div>
        </div>

        <div class="banner_bottom_bar">
          <div class="banner_bottom_left hwi_item">
            <i class="fa-solid fa-calendar-day"></i> ${Capi(fechaTexto)}
          </div>
          <div class="banner_bottom_right hwi_item">
            <div class="pancita_roles_box" id="inicio_pancita_roles_container">
              ${mensajesEnVivo.map((msg, i) => `
                <span class="pancita_role_item ${i === 0 ? 'active' : ''}">${msg}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Grid de Cards de Productividad con Animación Escalonada -->
      <div class="inicio_cards_grid">
        <!-- Card 1: Reloj & Cronómetro -->
        <div class="card_item hwi_item">
          <div class="card_header">
            <div class="card_icon_badge"><i class="fa-solid fa-clock"></i></div>
            <h3 class="card_title">Reloj & Temporizador</h3>
          </div>
          <div class="card_body">
            Consulta la hora digital con efecto neón, temporizadores para estudio y cronómetro activo.
          </div>
          <button class="card_action_btn" data-nav="/reloj">
            Abrir Reloj <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <!-- Card 2: Horario Semanal -->
        <div class="card_item hwi_item">
          <div class="card_header">
            <div class="card_icon_badge"><i class="fa-solid fa-calendar-days"></i></div>
            <h3 class="card_title">Horario Semanal</h3>
          </div>
          <div class="card_body">
            Organiza tus materias escolares, horas de repaso, actividades y tiempo libre.
          </div>
          <button class="card_action_btn" data-nav="/horario">
            Ver Horario <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <!-- Card 3: Asistente Pancita -->
        <div class="card_item hwi_item">
          <div class="card_header">
            <div class="card_icon_badge"><i class="fa-solid fa-robot"></i></div>
            <h3 class="card_title">Asistente Pancita</h3>
          </div>
          <div class="card_body">
            Resuelve dudas con IA, solicita consejos de estudio y recordatorios diarios parlantes.
          </div>
          <button class="card_action_btn" data-nav="/chat">
            Hablar con Pancita <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // 1. Cargar saludo personalizado libre de doble coma e inteligente
  const greetingEl = container.querySelector('#welcome_user_greeting');
  if (greetingEl) {
    greetingEl.innerHTML = `¡${saludoSmile()}! 👋`;
  }

  // 2. Frase motivacional rotativa del día
  const FRASES_MOTIVACIONALES = [
    "El único modo de hacer un gran trabajo es amar lo que haces. 🚀",
    "La productividad no es ser inteligente, es ser disciplinado. 💡",
    "Pequeños pasos todos los días conducen a grandes resultados. 🌟",
    "Mantén tu enfoque activo, la constancia vence al talento. 🎓",
    "Aprovecha cada hora de hoy, el tiempo es tu recurso más valioso. ⏰"
  ];
  const fraseHoy = FRASES_MOTIVACIONALES[new Date().getDay() % FRASES_MOTIVACIONALES.length];
  const quoteEl = container.querySelector('#welcome_motivation_quote');
  if (quoteEl) {
    quoteEl.textContent = fraseHoy;
  }

  // 3. Progreso del Día Reactivo en Vivo con requestAnimationFrame
  const pctEl = container.querySelector('#inicio_progress_pct');
  const fillEl = container.querySelector('#inicio_progress_fill');
  let ultMinutoProgreso = -1;

  const actualizarProgreso = () => {
    const pct = obtenerProgresoDia();
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;
  };

  function loopProgreso() {
    const minActual = new Date().getMinutes();
    if (minActual !== ultMinutoProgreso) {
      ultMinutoProgreso = minActual;
      actualizarProgreso();
    }
    animProgressFrameId = requestAnimationFrame(loopProgreso);
  }

  actualizarProgreso();
  animProgressFrameId = requestAnimationFrame(loopProgreso);

  // 4. Rotación de mensajes Pancita con regeneración al dar la vuelta
  let roleIdx = 0;
  const rolesBox = container.querySelector('#inicio_pancita_roles_container');

  const rotarMensajes = () => {
    let roleItems = container.querySelectorAll('.pancita_role_item');
    if (roleItems.length === 0) return;

    roleItems[roleIdx].classList.remove('active');
    roleIdx = (roleIdx + 1) % roleItems.length;

    // Si volvemos al principio, regeneramos los mensajes en vivo
    if (roleIdx === 0 && rolesBox) {
      const nuevosMensajes = obtenerMensajesInteligentes();
      rolesBox.innerHTML = nuevosMensajes.map((msg, i) => `
        <span class="pancita_role_item ${i === 0 ? 'active' : ''}">${msg}</span>
      `).join('');
      roleItems = container.querySelectorAll('.pancita_role_item');
    }

    if (roleItems[roleIdx]) {
      roleItems[roleIdx].classList.add('active');
    }
  };

  rolesTimer = setInterval(rotarMensajes, 7000);

  // 5. Eventos de navegación en las Cards
  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-nav');
      if (path) rutas.navegar(path);
    });
  });
}

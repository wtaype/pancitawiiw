// src/features/inicio/inicio.js
// Módulo de Inicio Asistente & Dashboard de Productividad (Hero Clock & herowi Animation & Pancita Roles)

import { Saludar, fechaHoy, Capi } from '@widev';
import state from '../../core/state.js';
import { rutas } from '@core/rutas.js';
import './inicio.css';

// ⏱️ TIEMPO DE ROTACIÓN EN SEGUNDOS (Fácil de cambiar: 30, 60, etc.)
let TIEMPO_HERO = 7;

let clockTimer = null;
let rolesTimer = null;

// Array de frases cortas, útiles y con íconos positivos
const MENSAJES_PANCITA = [
  'En 30 min tienes que dormir 🌙',
  'En 1 hora tienes clases de universidad 🎓 ',
  'Recuerda tomar un vaso de agua 💧 ',
  'Enfoque activo en tu materia principal 📚',
  '¡Vas excelente en tus metas hoy! 🏆'
];

export function arrancar(container) {
  // Limpiar temporizadores previos si existían
  if (clockTimer) clearInterval(clockTimer);
  if (rolesTimer) clearInterval(rolesTimer);

  const hrs = new Date().getHours();
  const iconoSolLuna = hrs >= 6 && hrs < 18 ? 'fa-cloud-sun' : 'fa-moon';
  const saludoTag = `${Saludar().toUpperCase()}  PANCITA!`;
  const fechaTexto = fechaHoy();
  const temaActual = state.tema || 'futuro';

  container.innerHTML = `
    <div class="inicio_container">
      <!-- Banner Hero de Bienvenida con Reloj Masivo vh -->
      <div class="welcome_banner">
        <div class="welcome_top_bar">
          <div class="welcome_tag hwi_item">
            <i class="fa-solid fa-sparkles"></i> ${saludoTag}
          </div>
          <div class="welcome_icon_box hwi_item">
            <i class="fa-solid ${iconoSolLuna}"></i>
          </div>
        </div>

        <div class="welcome_clock hwi_item" id="inicio_live_clock">
          --:--:--
        </div>

        <div class="banner_bottom_bar">
          <div class="banner_bottom_left hwi_item">
            <i class="fa-solid fa-calendar-day"></i> ${Capi(fechaTexto)}
          </div>
          <div class="banner_bottom_right hwi_item">
            <div class="pancita_roles_box">
              ${MENSAJES_PANCITA.map((msg, i) => `
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

  // 1. Reloj gigante en vivo en el hero banner
  const clockEl = container.querySelector('#inicio_live_clock');
  const updateClock = () => {
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString();
    }
  };
  updateClock();
  clockTimer = setInterval(updateClock, 1000);

  // 2. Rotación de mensajes Pancita según TIEMPO_HERO (en ms)
  let roleIdx = 0;
  const roles = container.querySelectorAll('.pancita_role_item');
  if (roles.length) {
    rolesTimer = setInterval(() => {
      roles[roleIdx].classList.remove('active');
      roleIdx = (roleIdx + 1) % roles.length;
      roles[roleIdx].classList.add('active');
    }, TIEMPO_HERO * 1000);
  }

  // 3. Eventos de navegación en las Cards
  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-nav');
      if (path) rutas.navegar(path);
    });
  });

}

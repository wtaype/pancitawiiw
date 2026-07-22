// src/features/cuenta/cuenta.js
// Orquestador principal y layout fijo de Cuenta

import { cuentaDB } from './lib/cuenta_db.js';
import state from '../../core/state.js';
import { wiTip, wiDate } from '@widev';
import './cuenta.css';

let tabActiva = 'perfil';
const cargados = new Set();

export const TABS = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-astronaut', position: 'left', active: true },
  { id: 'seguridad', label: 'Seguridad', icon: 'fa-shield-halved', position: 'left' },
  { id: 'apis', label: 'Centro APIs', icon: 'fa-cubes', position: 'left' },
  { id: 'guardar_perfil_action', label: 'Guardar', icon: 'fa-save', position: 'right', iconOnly: true }
];

export function arrancar(container) {
  // Limpiar listeners y timers previos
  if (container._cleanupCuenta) {
    container._cleanupCuenta();
  }

  // Cargar datos actuales
  const usuarioInfo = cuentaDB.obtenerCuenta();
  tabActiva = 'perfil';
  cargados.clear();

  // Renderizar la cuadrícula principal y el Hero Lateral derecho
  container.innerHTML = `
    <div class="cuenta_container">
      <div class="cuenta_wrap">
        <div class="cuenta_grid">
          
          <!-- Columna Izquierda: Formularios SPA Dinámicos -->
          <div class="cuenta_left">
            <div id="cuenta_section_perfil" class="cuenta_section_content active"></div>
            <div id="cuenta_section_seguridad" class="cuenta_section_content"></div>
            <div id="cuenta_section_apis" class="cuenta_section_content"></div>
          </div>

          <!-- Columna Derecha: Resumen de Cuenta e Información de Temas Fijo -->
          <div class="cuenta_right">
            
            <!-- Hero del Perfil -->
            <div class="cuenta_hero cuenta_card">
              <div class="cuenta_hero_main_row">
                <div class="cuenta_av_col">
                  <div class="cuenta_av_wrap">
                    <img id="cuenta_hero_av" src="${usuarioInfo.avatar || '/smile.avif'}" alt="Avatar" class="cuenta_av" onerror="this.src='/smile.avif'">
                    <div class="cuenta_av_ring"></div>
                  </div>
                </div>
                <div class="cuenta_hero_info">
                  <h1 class="cuenta_fullname" id="cuenta_hero_fullname">${usuarioInfo.nombre} ${usuarioInfo.apellidos}</h1>
                  <p class="cuenta_username"><i class="fa-solid fa-at"></i> <span id="cuenta_hero_username">${usuarioInfo.usuario}</span></p>
                  <div class="cuenta_hero_plan_wrap">
                    <span class="cuenta_rol_chip"><i class="fa-solid fa-crown"></i> <span id="cuenta_hero_plan">Plan ${usuarioInfo.plan.toUpperCase()}</span></span>
                  </div>
                </div>
              </div>
              
              <!-- Bolitas de temas visuales -->
              <div class="cuenta_theme_grid">
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'futuro' ? 'active' : ''}" data-ths="futuro" data-witip="Tema Futuro"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'cielo' ? 'active' : ''}" data-ths="cielo" data-witip="Tema Cielo"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'dulce' ? 'active' : ''}" data-ths="dulce" data-witip="Tema Dulce"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'paz' ? 'active' : ''}" data-ths="paz" data-witip="Tema Paz"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'oro' ? 'active' : ''}" data-ths="oro" data-witip="Tema Oro"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'mora' ? 'active' : ''}" data-ths="mora" data-witip="Tema Mora"></div>
              </div>
            </div>

            <!-- Datos Fijos de Cuenta -->
            <div class="cuenta_card">
              <h2 class="cuenta_card_tit"><i class="fa-solid fa-circle-info"></i> Datos de la Cuenta</h2>
              
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-envelope"></i> Email</span>
                <span class="cuenta_val em">${usuarioInfo.email}</span>
              </div>
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-crown"></i> Plan</span>
                <span class="cuenta_val cuenta_val_plan">${usuarioInfo.plan}</span>
              </div>
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-signal"></i> Estado</span>
                <span class="cuenta_val cuenta_val_success">${usuarioInfo.estado}</span>
              </div>
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-toggle-on"></i> Activo</span>
                <span class="cuenta_val cuenta_val_success">Sí</span>
              </div>
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-calendar-day"></i> Registro</span>
                <span class="cuenta_val">${usuarioInfo.creado ? wiDate(null).get(usuarioInfo.creado, 'local') : 'Desconocido'}</span>
              </div>
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-clock-rotate-left"></i> Actividad</span>
                <span class="cuenta_val" id="cuenta_info_actividad">${usuarioInfo.ultActividad ? wiDate(null).get(usuarioInfo.ultActividad, 'local') : 'Recién activo'}</span>
              </div>
              <div class="cuenta_row">
                <span class="cuenta_lbl"><i class="fa-solid fa-user-tag"></i> Rol</span>
                <span class="cuenta_val cuenta_val_capitalize">${usuarioInfo.rol === 'admin' ? 'Administrador' : usuarioInfo.rol}</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  let tempTema = usuarioInfo.tema || 'futuro';

  // 1. Inicializar tooltips en el contenedor cargado (data-witip)
  wiTip();

  // 2. Selección de temas interactivos mediante "bolitas" de colores
  const balls = container.querySelectorAll('.cuenta_theme_ball');
  balls.forEach(ball => {
    ball.addEventListener('click', () => {
      balls.forEach(b => b.classList.remove('active'));
      ball.classList.add('active');
      const selectedTheme = ball.getAttribute('data-ths');
      tempTema = selectedTheme;
      
      // Aplicar el tema globalmente y guardarlo en la DB
      state.setTema(selectedTheme);
      cuentaDB.guardarCuenta({ tema: selectedTheme });
    });
  });

  // 3. Cargar subsecciones SPA bajo demanda
  const cargarSubseccion = async (tabId, force = false) => {
    const panel = container.querySelector(`#cuenta_section_${tabId}`);
    if (!panel) return;

    if (!force && cargados.has(tabId)) {
      return;
    }

    panel.innerHTML = `
      <div class="cuenta_loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando...
      </div>
    `;

    try {
      const modulo = await import(`./secciones/${tabId}.js`);
      if (modulo.arrancar) {
        panel.innerHTML = '';
        modulo.arrancar(panel);
        cargados.add(tabId);
      }
    } catch (err) {
      console.error(`[Cuenta] Error al cargar subsección ${tabId}:`, err);
      panel.innerHTML = `<div class="cuenta_loading" style="color: var(--dulce);">Error al cargar esta sección.</div>`;
    }
  };

  // Evento para cambiar de pestaña horizontal
  const handleSubtabChange = (e) => {
    const subtabId = e.detail.subtabId;
    if (['perfil', 'seguridad', 'apis'].includes(subtabId)) {
      tabActiva = subtabId;
      
      const grid = container.querySelector('.cuenta_grid');
      if (grid) {
        if (subtabId === 'perfil') {
          grid.classList.remove('full_width');
        } else {
          grid.classList.add('full_width');
        }
      }
      
      // Mostrar/ocultar contenedores en el DOM
      container.querySelectorAll('.cuenta_section_content').forEach(sect => {
        if (sect.id === `cuenta_section_${subtabId}`) {
          sect.classList.add('active');
        } else {
          sect.classList.remove('active');
        }
      });

      cargarSubseccion(subtabId);
    }
  };

  // Evento para gatillar acción del botón de guardar global (lado derecho)
  const handleSubtabAction = (e) => {
    if (e.detail.actionId === 'guardar_perfil_action') {
      const activePanel = container.querySelector(`#cuenta_section_${tabActiva}`);
      if (activePanel && typeof activePanel._guardarAccion === 'function') {
        activePanel._guardarAccion();
      }
    }
  };

  // Registrar listeners
  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);

  // Carga inicial
  cargarSubseccion('perfil');

  // Guardar función de limpieza
  container._cleanupCuenta = () => {
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
  };
}

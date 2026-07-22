// src/features/cuenta/cuenta.js
// Controlador principal para la sección de Cuenta

import { cuentaDB } from './lib/cuenta_db.js';
import state from '../../core/state.js';
import { getls, savels, Mensaje, wiTip, wiDate } from '@widev';
import './cuenta.css';

let tabActiva = 'perfil'; // 'perfil' | 'seguridad'

export const TABS = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-astronaut', position: 'left', active: true },
  { id: 'seguridad', label: 'Seguridad', icon: 'fa-shield-halved', position: 'left' },
  { id: 'apis', label: 'Centro APIs', icon: 'fa-cubes', position: 'left' },
  { id: 'guardar_perfil_action', label: 'Guardar', icon: 'fa-save', position: 'right', iconOnly:true }
];

export function arrancar(container) {
  // Limpiar listeners y timers previos si existen en este contenedor
  if (container._cleanupCuenta) {
    container._cleanupCuenta();
  }

  // Cargar datos actuales de la base de datos local
  const usuarioInfo = cuentaDB.obtenerCuenta();
  
  // Establecer tab activa inicial
  tabActiva = 'perfil';

  // Renderizar la maqueta principal (Layout de Perfil e Información lateral)
  container.innerHTML = `
    <div class="cuenta_container">
      <div class="cuenta_wrap">

        <!-- Grid de dos columnas: Formulario a la izquierda y Datos informativos a la derecha -->
        <div class="cuenta_grid">
          
          <!-- Columna Izquierda (cuenta_left): Formularios Editables -->
          <div class="cuenta_left">
            
            <!-- Pestaña Perfil -->
            <div id="cuenta_section_perfil" class="cuenta_section_content active">
              <div class="cuenta_card">
                <h2 class="cuenta_card_tit"><i class="fa-solid fa-user-pen"></i> Editar Perfil</h2>
                
                <div class="cuenta_form_2col">
                  <div class="cuenta_form_grp">
                    <label for="cuenta_nombre"><i class="fa-solid fa-user"></i> Nombres</label>
                    <input id="cuenta_nombre" type="text" value="${usuarioInfo.nombre}" placeholder="Tus nombres">
                  </div>
                  <div class="cuenta_form_grp">
                    <label for="cuenta_apellidos"><i class="fa-solid fa-user"></i> Apellidos</label>
                    <input id="cuenta_apellidos" type="text" value="${usuarioInfo.apellidos}" placeholder="Tus apellidos">
                  </div>
                </div>

                <div class="cuenta_form_grp">
                  <label for="cuenta_avatar"><i class="fa-solid fa-image"></i> Enlace del Avatar (URL)</label>
                  <input id="cuenta_avatar" type="text" value="${usuarioInfo.avatar}" placeholder="https://tu-foto.com/imagen.jpg">
                </div>

                <div class="cuenta_form_2col">
                  <div class="cuenta_form_grp">
                    <label for="cuenta_nacimiento"><i class="fa-solid fa-calendar-days"></i> Fecha de Nacimiento</label>
                    <input type="date" id="cuenta_nacimiento" value="${usuarioInfo.fechaNacimiento || ''}">
                  </div>
                  <div class="cuenta_form_grp">
                    <label for="cuenta_genero"><i class="fa-solid fa-venus-mars"></i> Género</label>
                    <select id="cuenta_genero">
                      <option value="" disabled ${!usuarioInfo.genero ? 'selected' : ''}>Selecciona tu género</option>
                      <option value="Masculino" ${usuarioInfo.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                      <option value="Femenino" ${usuarioInfo.genero === 'Femenino' ? 'selected' : ''}>Femenino</option>
                      <option value="Otro" ${usuarioInfo.genero === 'Otro' ? 'selected' : ''}>Otro</option>
                      <option value="Prefiero no decirlo" ${usuarioInfo.genero === 'Prefiero no decirlo' ? 'selected' : ''}>Prefiero no decirlo</option>
                    </select>
                  </div>
                </div>

                <div class="cuenta_form_2col">
                  <div class="cuenta_form_grp">
                    <label for="cuenta_pais"><i class="fa-solid fa-earth-americas"></i> País</label>
                    <input id="cuenta_pais" type="text" value="${usuarioInfo.pais || ''}" placeholder="Ej. Perú, México...">
                  </div>
                  <div class="cuenta_form_grp">
                    <label for="cuenta_gustos"><i class="fa-solid fa-heart"></i> Gustos o intereses</label>
                    <input id="cuenta_gustos" type="text" value="${usuarioInfo.gustos || ''}" placeholder="Ej. Programar, leer...">
                  </div>
                </div>

                <div class="cuenta_form_2col">
                  <div class="cuenta_form_grp">
                    <label for="cuenta_celular"><i class="fa-solid fa-phone"></i> Celular o teléfono</label>
                    <input id="cuenta_celular" type="text" value="${usuarioInfo.celular || ''}" placeholder="Ej. +51 987 654 321">
                  </div>
                  <div class="cuenta_form_grp">
                    <label for="cuenta_instagram"><i class="fa-brands fa-instagram"></i> Usuario de Instagram</label>
                    <input id="cuenta_instagram" type="text" value="${usuarioInfo.instagram || ''}" placeholder="Ej. tu_usuario">
                  </div>
                </div>

                <div class="cuenta_form_grp">
                  <label for="cuenta_bio"><i class="fa-solid fa-address-card"></i> Biografía</label>
                  <input id="cuenta_bio" type="text" value="${usuarioInfo.bio || ''}" placeholder="Cuéntanos un poco sobre ti...">
                </div>

                <button id="cuenta_guardar_btn" class="cuenta_btn"><i class="fa-solid fa-save"></i> Guardar Cambios</button>
              </div>
            </div>

            <!-- Pestaña Seguridad -->
            <div id="cuenta_section_seguridad" class="cuenta_section_content">
              <div class="cuenta_card">
                <h2 class="cuenta_card_tit"><i class="fa-solid fa-lock"></i> Actualizar Contraseña</h2>
                
                <div class="cuenta_form_grp">
                  <label for="cuenta_pass"><i class="fa-solid fa-key"></i> Nueva contraseña</label>
                  <div class="cuenta_pass_wrap">
                    <input type="password" id="cuenta_pass" placeholder="Ingresa tu nueva contraseña">
                    <button type="button" class="cuenta_pass_eye" data-target="cuenta_pass">
                      <i class="fa-solid fa-eye-slash"></i>
                    </button>
                  </div>
                </div>
                
                <div class="cuenta_form_grp">
                  <label for="cuenta_pass_conf"><i class="fa-solid fa-key"></i> Confirmar contraseña</label>
                  <div class="cuenta_pass_wrap">
                    <input type="password" id="cuenta_pass_conf" placeholder="Confirma tu nueva contraseña">
                    <button type="button" class="cuenta_pass_eye" data-target="cuenta_pass_conf">
                      <i class="fa-solid fa-eye-slash"></i>
                    </button>
                  </div>
                </div>

                <button id="cuenta_guardar_pass_btn" class="cuenta_btn"><i class="fa-solid fa-shield-halved"></i> Actualizar Contraseña</button>
              </div>
            </div>

            <!-- Pestaña Centro APIs -->
            <div id="cuenta_section_apis" class="cuenta_section_content">
              <div class="cuenta_card">
                <h2 class="cuenta_card_tit"><i class="fa-solid fa-cubes"></i> Configuración de APIs</h2>
                
                <div class="cuenta_form_grp">
                  <label for="cuenta_gemini_key"><i class="fa-solid fa-key"></i> Clave API de Gemini</label>
                  <div class="cuenta_pass_wrap">
                    <input type="password" id="cuenta_gemini_key" placeholder="AIzaSy...">
                    <button type="button" class="cuenta_pass_eye" data-target="cuenta_gemini_key">
                      <i class="fa-solid fa-eye-slash"></i>
                    </button>
                  </div>
                  <p class="cuenta_form_tip">Esta clave se utilizará para realizar las peticiones de streaming de ChatWii. Obtén tu clave en <a href="https://aistudio.google.com/api-keys" target="_blank" class="cuenta_api_link" style="color: var(--mco); text-decoration: none; font-weight: 600; transition: opacity var(--tr_f);"><i class="fa-solid fa-up-right-from-square" style="font-size: var(--fz_s3);"></i> Google AI Studio</a>.</p>
                </div>

                <div class="cuenta_form_grp">
                  <label for="cuenta_gemini_model"><i class="fa-solid fa-brain"></i> Modelo Gemini Principal</label>
                  <select id="cuenta_gemini_model" class="cuenta_form_select">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Rápido)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-flash-latest">Gemini Flash Latest</option>
                  </select>
                  <p class="cuenta_form_tip">Modelo de lenguaje preferido para las respuestas del chat.</p>
                </div>

                <button id="cuenta_guardar_apis_btn" class="cuenta_btn"><i class="fa-solid fa-save"></i> Guardar APIs</button>
              </div>
            </div>

          </div>

          <!-- Columna Derecha (cuenta_right): Datos de Cuenta Informativos -->
          <div class="cuenta_right">
            
            <!-- 1. Hero del Perfil (Con avatar a 50%, info a 50% y bolitas a 100% abajo) -->
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
              
              <!-- Bolitas de temas visuales (a 100% solitas en una nueva fila inferior) -->
              <div class="cuenta_theme_grid">
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'futuro' ? 'active' : ''}" data-ths="futuro" data-witip="Tema Futuro"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'cielo' ? 'active' : ''}" data-ths="cielo" data-witip="Tema Cielo"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'dulce' ? 'active' : ''}" data-ths="dulce" data-witip="Tema Dulce"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'paz' ? 'active' : ''}" data-ths="paz" data-witip="Tema Paz"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'oro' ? 'active' : ''}" data-ths="oro" data-witip="Tema Oro"></div>
                <div class="cuenta_theme_ball ${usuarioInfo.tema === 'mora' ? 'active' : ''}" data-ths="mora" data-witip="Tema Mora"></div>
              </div>
            </div>

            <!-- 2. Tarjeta de Datos de la Cuenta -->
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

  // --- LÓGICA DE EVENTOS ---
  let tempTema = usuarioInfo.tema || 'futuro';

  // Inicializar tooltips en el contenedor cargado (data-witip)
  wiTip();

  // 1. Cambio dinámico de avatar en vivo
  const inputAvatar = container.querySelector('#cuenta_avatar');
  const avImg = container.querySelector('#cuenta_hero_av');
  if (inputAvatar && avImg) {
    const handleAvatarInput = () => {
      avImg.src = inputAvatar.value.trim() || '/smile.avif';
    };
    inputAvatar.addEventListener('input', handleAvatarInput);
  }

  // 2. Selección de temas interactivos mediante "bolitas" de colores
  const balls = container.querySelectorAll('.cuenta_theme_ball');
  balls.forEach(ball => {
    ball.addEventListener('click', () => {
      balls.forEach(b => b.classList.remove('active'));
      ball.classList.add('active');
      const selectedTheme = ball.getAttribute('data-ths');
      tempTema = selectedTheme;
      // Vista previa instantánea (Optimizada en state.js sin re-agregar listeners)
      state.setTema(selectedTheme);
    });
  });

  // 3. Ocultar / Mostrar contraseñas
  const eyes = container.querySelectorAll('.cuenta_pass_eye');
  eyes.forEach(eye => {
    eye.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = eye.getAttribute('data-target');
      const input = container.querySelector(`#${targetId}`);
      const icon = eye.querySelector('i');
      if (input && icon) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        icon.className = isPass ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      }
    });
  });

  // 4. Acción de Guardar Perfil
  const guardarPerfil = () => {
    const inputNombre = container.querySelector('#cuenta_nombre');
    const inputApellidos = container.querySelector('#cuenta_apellidos');
    const inputAvatarVal = container.querySelector('#cuenta_avatar');
    const inputNacimiento = container.querySelector('#cuenta_nacimiento');
    const selectGenero = container.querySelector('#cuenta_genero');
    const inputPais = container.querySelector('#cuenta_pais');
    const inputGustos = container.querySelector('#cuenta_gustos');
    const inputCelular = container.querySelector('#cuenta_celular');
    const inputInstagram = container.querySelector('#cuenta_instagram');
    const inputBio = container.querySelector('#cuenta_bio');

    const nombre = inputNombre?.value.trim() || '';
    const apellidos = inputApellidos?.value.trim() || '';

    if (!nombre) {
      wiTip(inputNombre, '¡Ingresa tu nombre!', 'error');
      return;
    }

    const pNombre = nombre.trim().split(/\s+/)[0]?.toLowerCase() || '';
    const pApellido = apellidos.trim().split(/\s+/)[0]?.toLowerCase() || '';
    const usuario = pNombre && pApellido ? `${pNombre}${pApellido}` : (pNombre || 'pancita');

    const updates = {
      nombre,
      apellidos,
      usuario,
      avatar: inputAvatarVal?.value.trim() || '/smile.avif',
      fechaNacimiento: inputNacimiento?.value || '',
      genero: selectGenero?.value || '',
      pais: inputPais?.value.trim() || '',
      gustos: inputGustos?.value.trim() || '',
      celular: inputCelular?.value.trim() || '',
      instagram: inputInstagram?.value.trim() || '',
      bio: inputBio?.value.trim() || '',
      tema: tempTema
    };

    // Guardar cambios en DB local
    const perfilGuardado = cuentaDB.guardarCuenta(updates);

    // Actualizar elementos visuales del Hero
    const fullnameEl = container.querySelector('#cuenta_hero_fullname');
    if (fullnameEl) fullnameEl.textContent = `${perfilGuardado.nombre} ${perfilGuardado.apellidos}`;
    
    const usernameEl = container.querySelector('#cuenta_hero_username');
    if (usernameEl) usernameEl.textContent = perfilGuardado.usuario;

    const avImgHero = container.querySelector('#cuenta_hero_av');
    if (avImgHero) avImgHero.src = perfilGuardado.avatar || '/smile.avif';

    // Actualizar texto de actividad
    const actividadEl = container.querySelector('#cuenta_info_actividad');
    if (actividadEl) {
      actividadEl.textContent = wiDate(null).get(perfilGuardado.ultActividad, 'local');
    }

    Mensaje('¡Perfil guardado correctamente!', 'success');
  };

  const btnGuardarPerfil = container.querySelector('#cuenta_guardar_btn');
  if (btnGuardarPerfil) {
    btnGuardarPerfil.addEventListener('click', guardarPerfil);
  }

  // 5. Acción de Guardar Contraseña (Simulación)
  const guardarContrasena = async () => {
    const inputPass = container.querySelector('#cuenta_pass');
    const inputPassConf = container.querySelector('#cuenta_pass_conf');
    const btnGuardarPass = container.querySelector('#cuenta_guardar_pass_btn');

    const p1 = inputPass?.value || '';
    const p2 = inputPassConf?.value || '';

    if (!p1 || p1.length < 6) {
      wiTip(inputPass, 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (p1 !== p2) {
      wiTip(inputPassConf, 'Las contraseñas no coinciden', 'error');
      return;
    }

    if (btnGuardarPass) {
      btnGuardarPass.disabled = true;
      btnGuardarPass.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...`;
    }

    try {
      const res = await cuentaDB.actualizarContrasena(p1);
      if (res.success) {
        if (inputPass) inputPass.value = '';
        if (inputPassConf) inputPassConf.value = '';
        Mensaje('¡Contraseña actualizada correctamente!', 'success');
      }
    } catch (err) {
      Mensaje(err.message || 'Error al actualizar contraseña', 'error');
    } finally {
      if (btnGuardarPass) {
        btnGuardarPass.disabled = false;
        btnGuardarPass.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Actualizar Contraseña`;
      }
    }
  };

  const btnGuardarPass = container.querySelector('#cuenta_guardar_pass_btn');
  if (btnGuardarPass) {
    btnGuardarPass.addEventListener('click', guardarContrasena);
  }

  // 6. Acción de Guardar APIs
  const guardarApis = () => {
    const inputKey = container.querySelector('#cuenta_gemini_key');
    const selectModel = container.querySelector('#cuenta_gemini_model');
    const keyVal = inputKey?.value.trim() || '';
    const modelVal = selectModel?.value || 'gemini-2.5-flash';

    localStorage.setItem('gemini_api_key', keyVal);
    localStorage.setItem('gemini_model', modelVal);
    Mensaje('¡Configuración de APIs guardada correctamente!', 'success');
  };

  const btnGuardarApis = container.querySelector('#cuenta_guardar_apis_btn');
  if (btnGuardarApis) {
    btnGuardarApis.addEventListener('click', guardarApis);
  }

  // Cargar clave API y modelo guardados
  const savedKeyVal = localStorage.getItem('gemini_api_key') || '';
  const savedModelVal = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
  const inputKey = container.querySelector('#cuenta_gemini_key');
  const selectModel = container.querySelector('#cuenta_gemini_model');
  if (inputKey) inputKey.value = savedKeyVal;
  if (selectModel) selectModel.value = savedModelVal;

  // --- NAVEGACIÓN ENTRE SUB-TABS ---
  const handleSubtabChange = (e) => {
    const subtabId = e.detail.subtabId;
    if (subtabId === 'perfil' || subtabId === 'seguridad' || subtabId === 'apis') {
      tabActiva = subtabId;
      
      // Alternar clases activas en los contenedores de sección
      container.querySelectorAll('.cuenta_section_content').forEach(sect => {
        if (sect.id === `cuenta_section_${subtabId}`) {
          sect.classList.add('active');
        } else {
          sect.classList.remove('active');
        }
      });
    }
  };

  const handleSubtabAction = (e) => {
    if (e.detail.actionId === 'guardar_perfil_action') {
      if (tabActiva === 'perfil') {
        guardarPerfil();
      } else if (tabActiva === 'seguridad') {
        guardarContrasena();
      } else if (tabActiva === 'apis') {
        guardarApis();
      }
    }
  };

  // Registrar listeners globales
  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);

  // Guardar función de limpieza
  container._cleanupCuenta = () => {
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
  };
}

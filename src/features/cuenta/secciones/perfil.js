// src/features/cuenta/secciones/perfil.js
// Sub-pestaña: Editar Perfil

import { cuentaDB } from '../lib/cuenta_db.js';
import { Mensaje, wiTip, wiDate } from '@widev';

export function arrancar(panel) {
  const usuarioInfo = cuentaDB.obtenerCuenta();

  panel.innerHTML = `
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
          <select id="cuenta_genero" class="cuenta_form_select">
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
  `;

  // 1. Cambio dinámico de avatar en vivo en la columna lateral
  const inputAvatar = panel.querySelector('#cuenta_avatar');
  const avImg = document.querySelector('#cuenta_hero_av');
  if (inputAvatar && avImg) {
    inputAvatar.addEventListener('input', () => {
      avImg.src = inputAvatar.value.trim() || '/smile.avif';
    });
  }

  // 2. Guardar cambios del perfil
  const guardarPerfil = () => {
    const inputNombre = panel.querySelector('#cuenta_nombre');
    const inputApellidos = panel.querySelector('#cuenta_apellidos');
    const inputAvatarVal = panel.querySelector('#cuenta_avatar');
    const inputNacimiento = panel.querySelector('#cuenta_nacimiento');
    const selectGenero = panel.querySelector('#cuenta_genero');
    const inputPais = panel.querySelector('#cuenta_pais');
    const inputGustos = panel.querySelector('#cuenta_gustos');
    const inputCelular = panel.querySelector('#cuenta_celular');
    const inputInstagram = panel.querySelector('#cuenta_instagram');
    const inputBio = panel.querySelector('#cuenta_bio');

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
      bio: inputBio?.value.trim() || ''
    };

    // Guardar cambios en la DB local
    const perfilGuardado = cuentaDB.guardarCuenta(updates);

    // Actualizar elementos visuales del Hero Fijo
    const fullnameEl = document.querySelector('#cuenta_hero_fullname');
    if (fullnameEl) fullnameEl.textContent = `${perfilGuardado.nombre} ${perfilGuardado.apellidos}`;
    
    const usernameEl = document.querySelector('#cuenta_hero_username');
    if (usernameEl) usernameEl.textContent = perfilGuardado.usuario;

    const avImgHero = document.querySelector('#cuenta_hero_av');
    if (avImgHero) avImgHero.src = perfilGuardado.avatar || '/smile.avif';

    const actividadEl = document.querySelector('#cuenta_info_actividad');
    if (actividadEl) {
      actividadEl.textContent = wiDate(null).get(perfilGuardado.ultActividad, 'local');
    }

    Mensaje('¡Perfil guardado correctamente!', 'success');
  };

  const btnGuardar = panel.querySelector('#cuenta_guardar_btn');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarPerfil);
  }

  // Guardar listener para llamadas desde el action global de la derecha
  panel._guardarAccion = guardarPerfil;
}

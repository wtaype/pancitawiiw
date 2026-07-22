// src/features/cuenta/secciones/seguridad.js
// Sub-pestaña: Seguridad (Contraseña)

import { cuentaDB } from '../lib/cuenta_db.js';
import { Mensaje, wiTip } from '@widev';

export function arrancar(panel) {
  panel.innerHTML = `
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
  `;

  // 1. Mostrar / Ocultar contraseñas
  const eyes = panel.querySelectorAll('.cuenta_pass_eye');
  eyes.forEach(eye => {
    eye.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = eye.getAttribute('data-target');
      const input = panel.querySelector(`#${targetId}`);
      const icon = eye.querySelector('i');
      if (input && icon) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        icon.className = isPass ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      }
    });
  });

  // 2. Guardar contraseña
  const actualizarContrasena = async () => {
    const inputPass = panel.querySelector('#cuenta_pass');
    const inputPassConf = panel.querySelector('#cuenta_pass_conf');
    const btnGuardarPass = panel.querySelector('#cuenta_guardar_pass_btn');

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

  const btnGuardarPass = panel.querySelector('#cuenta_guardar_pass_btn');
  if (btnGuardarPass) {
    btnGuardarPass.addEventListener('click', actualizarContrasena);
  }

  // Guardar listener para llamadas desde el action global de la derecha
  panel._guardarAccion = actualizarContrasena;
}

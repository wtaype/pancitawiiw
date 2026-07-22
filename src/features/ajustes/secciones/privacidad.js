// src/features/ajustes/secciones/privacidad.js
// Sub-pestaña Privacidad — Política de privacidad, almacenamiento local e inyección de llaves

import './privacidad.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="privacidad_section_wrap">
      <div class="ajustes_card privacidad_card">
        <h3 class="privacidad_title"><i class="fa-solid fa-user-shield"></i> Política de Privacidad y Datos</h3>
        
        <p class="privacidad_intro">
          En <strong>Pancitawii</strong>, valoramos tu privacidad por encima de todo. Toda la información de tu cuenta, horario y configuraciones se almacena de forma local y segura en tu dispositivo.
        </p>

        <div class="privacidad_points">
          <div class="privacidad_point_row">
            <div class="privacidad_point_icon"><i class="fa-solid fa-database"></i></div>
            <div class="privacidad_point_content">
              <h4>Almacenamiento Local Físico</h4>
              <p>Tu horario semanal, información de perfil, y preferencias se guardan directamente en archivos JSON dentro de tu directorio de usuario de Windows (AppDataLocal). Ningún dato personal es enviado a bases de datos en la nube.</p>
            </div>
          </div>

          <div class="privacidad_point_row">
            <div class="privacidad_point_icon"><i class="fa-solid fa-key"></i></div>
            <div class="privacidad_point_content">
              <h4>Control de Claves API</h4>
              <p>Tu clave personal de Gemini API se almacena de forma local en el almacenamiento seguro de tu navegador web y es utilizada exclusivamente para realizar solicitudes directas y autenticadas a los servidores de inteligencia artificial de Google.</p>
            </div>
          </div>

          <div class="privacidad_point_row">
            <div class="privacidad_point_icon"><i class="fa-solid fa-network-wired"></i></div>
            <div class="privacidad_point_content">
              <h4>Sin Rastreo (No Tracking)</h4>
              <p>No recopilamos telemetría, cookies de rastreo, ni analíticas de uso sobre lo que escribes en ChatWii o cómo organizas tus rutinas. Tienes el control total e independiente sobre tus datos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

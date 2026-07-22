// src/features/ajustes/secciones/terminos.js
// Sub-pestaña Términos — Términos y condiciones, licencias y deslindes de responsabilidad

import './terminos.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="terminos_section_wrap">
      <div class="ajustes_card terminos_card">
        <h3 class="terminos_title"><i class="fa-solid fa-file-signature"></i> Términos y Condiciones de Uso</h3>
        
        <p class="terminos_intro">
          Al utilizar <strong>Pancitawii</strong>, aceptas y te comprometes a cumplir con los siguientes términos de servicio:
        </p>

        <div class="terminos_rules">
          <div class="terminos_rule_block">
            <h4>1. Licencia de Uso</h4>
            <p>Se te otorga una licencia personal, no exclusiva y limitada para instalar y ejecutar Pancitawii localmente en tu sistema operativo Windows para la organización personal de tus horarios y tareas diarias.</p>
          </div>

          <div class="terminos_rule_block">
            <h4>2. Responsabilidad de Uso de la IA</h4>
            <p>Las respuestas provistas por ChatWii (Pancita) provienen de la integración directa con los modelos de Gemini. No somos responsables por respuestas inexactas, erróneas o por cualquier acción tomada basándose en las sugerencias de la IA. Verifique siempre la información crucial.</p>
          </div>

          <div class="terminos_rule_block">
            <h4>3. Credenciales y API Keys</h4>
            <p>Eres plenamente responsable de resguardar y mantener en secreto tu propia clave de Gemini API. El uso excesivo o cargos asociados a tu clave API corren bajo tu absoluta cuenta y responsabilidad en base a las políticas de facturación de Google AI Studio.</p>
          </div>

          <div class="terminos_rule_block">
            <h4>4. Modificaciones y Deslinde</h4>
            <p>Este software se distribuye "tal cual es" (AS IS) sin garantías de ningún tipo. Nos reservamos el derecho de actualizar la suite o modificar el código fuente para mejorar el rendimiento sin aviso previo.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

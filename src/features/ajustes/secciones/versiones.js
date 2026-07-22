// src/features/ajustes/secciones/versiones.js
// Sub-pestaña Versiones — Historial de cambios, versiones y bitácora de Pancitawii

import './versiones.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="versiones_section_wrap">
      <div class="ajustes_card versiones_card">
        <h3 class="versiones_title"><i class="fa-solid fa-code-branch"></i> Historial de Versiones</h3>
        
        <p class="versiones_intro">
          Sigue el progreso de desarrollo y las mejoras integradas en cada versión de <strong>Pancitawii</strong>:
        </p>

        <div class="versiones_timeline">
          <!-- Versión 2.0.0 -->
          <div class="timeline_item active_version">
            <div class="timeline_badge"><i class="fa-solid fa-star"></i></div>
            <div class="timeline_content">
              <div class="timeline_header">
                <span class="timeline_version">v2.0.0</span>
                <span class="timeline_date">Julio 2026 (Actual)</span>
              </div>
              <h4>Refactorización Modular e Integración Nativa</h4>
              <ul class="timeline_features">
                <li><strong>Anti-Suspensión Win32</strong>: Toggle premium estilo Apple para prevenir el apagado automático del monitor y el estado de suspensión de Windows.</li>
                <li><strong>Absorción de Acerca</strong>: Unificación de la página Sobre Pancitawii dentro de la vista modular de Ajustes.</li>
                <li><strong>Hojas de Estilo CSS Modulares</strong>: Estilos CSS aislados por sub-sección para mejorar el tiempo de carga y mantenimiento.</li>
                <li><strong>Refresco en Caliente (F5)</strong>: Botón de actualización rápida en la barra superior derecha.</li>
              </ul>
            </div>
          </div>

          <!-- Versión 1.0.0 -->
          <div class="timeline_item">
            <div class="timeline_badge"><i class="fa-solid fa-check"></i></div>
            <div class="timeline_content">
              <div class="timeline_header">
                <span class="timeline_version">v1.0.0</span>
                <span class="timeline_date">Julio 2026</span>
              </div>
              <h4>Lanzamiento Inicial</h4>
              <ul class="timeline_features">
                <li><strong>Horario Semanal</strong>: Sistema inteligente de rutinas diarias y seguimiento de bloques.</li>
                <li><strong>Reloj y Cronómetro</strong>: Reloj digital profesional con anuncios sonoros de cambio de actividad.</li>
                <li><strong>ChatWii Core</strong>: Asistente personal interactivo en tiempo real conectado a Gemini y con persistencia JSON asíncrona local.</li>
                <li><strong>Reproductor de Música</strong>: Integración de música ambiente con controles directos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// src/features/horario/horario.js
import './horario.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="horario_feature_wrap">
      <div class="horario_card">
        <h3><i class="fas fa-calendar-days"></i> Horario Semanal y Rutinas</h3>
        <p>📅 Aquí irá la grilla interactiva del horario de materias y actividades del hermanito.</p>
      </div>
    </div>
  `;
}

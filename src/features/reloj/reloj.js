// src/features/reloj/reloj.js
import './reloj.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="reloj_feature_wrap">
      <div class="reloj_card">
        <h3><i class="fas fa-clock"></i> Reloj Digital Profesional</h3>
        <div class="reloj_display_preview">12:30:45 PM</div>
        <p>🕒 Aquí irá el Reloj Digital Neón, Temporizador y Cronómetro activo para el hermanito.</p>
      </div>
    </div>
  `;
}

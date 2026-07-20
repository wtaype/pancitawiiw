// src/features/ajustes/ajustes.js
import './ajustes.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="ajustes_feature_wrap">
      <div class="ajustes_card">
        <h3><i class="fas fa-gear"></i> Configuración y Anti-Suspensión</h3>
        <p>⚡ Aquí se activará el switch Anti-Suspensión Win32 (pantalla activa) y los temas de color.</p>
      </div>
    </div>
  `;
}

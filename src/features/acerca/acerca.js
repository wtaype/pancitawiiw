// src/features/acerca/acerca.js
import './acerca.css';
import wii from '../../wii.js';

export function arrancar(container) {
  container.innerHTML = `
    <div class="acerca_feature_wrap">
      <div class="acerca_card">
        <h3><i class="fas fa-info-circle"></i> Acerca de ${wii.app}</h3>
        <p>ℹ️ ${wii.descri}</p>
        <p>Versión: <strong>v${wii.versionName}</strong> | Desarrollado por: <strong>${wii.by}</strong></p>
      </div>
    </div>
  `;
}

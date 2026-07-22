// src/features/ajustes/secciones/acerca.js
import './acerca.css';
export function arrancar(container) {
  container.innerHTML = `
    <div class="acerca_section_wrap">
      <div class="acerca_card">
        <h3><i class="fa-solid fa-circle-info"></i> Acerca de Pancitawii</h3>
        <p>Próximamente en Fase 3...</p>
      </div>
    </div>
  `;
}

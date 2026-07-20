// src/core/componentes/main.js
// Componente contenedor principal (#wimain) adaptado a las clases de app.css

export function renderMainContainer() {
  return `
    <main id="wimain" class="wii_main">
      <div class="wi_cargador">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando...
      </div>
    </main>
  `;
}

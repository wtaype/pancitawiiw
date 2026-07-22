// src/features/inicio/lib/progreso.js
// Cálculo del progreso porcentual del día actual (0% - 100%)

export function obtenerProgresoDia() {
  const ahora = new Date();
  const hrs24 = ahora.getHours();
  const segundosPasados = (hrs24 * 3600) + (ahora.getMinutes() * 60) + ahora.getSeconds();
  return Math.round((segundosPasados / 86400) * 100);
}

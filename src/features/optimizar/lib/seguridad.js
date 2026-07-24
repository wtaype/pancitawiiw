// src/features/optimizar/lib/seguridad.js
// Escudo Anti-Descargas y reglas de protección activa para el módulo optimizar

export const CATEGORIAS_PROTEGIDAS = ['downloads_dir', 'cookies_navegador', 'sesiones_navegador'];

export function esCategoriaProtegida(idCategoria) {
  return CATEGORIAS_PROTEGIDAS.includes(idCategoria);
}

export function obtenerEstadoInicialCheck(categoria) {
  // Si la categoría está protegida por el Escudo Anti-Descargas, se marca DESMARCADA por defecto
  if (categoria.protegida || esCategoriaProtegida(categoria.id)) {
    return false;
  }
  return true;
}

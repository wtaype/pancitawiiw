// src/features/duplicados/lib/reglas_seleccion.js
// Lógica de selección inteligente automatizada para archivos duplicados

/**
 * Aplica reglas de auto-selección a la lista de grupos de duplicados
 * @param {Array} grupos Lista de grupos
 * @param {string} regla "conservar_antiguo" | "conservar_nuevo" | "desmarcar_todos" | "marcar_todos_menos_uno"
 * @param {Set<string>} rutasSeleccionadas Set mutable de rutas actualmente marcadas para eliminar
 */
export function aplicarReglaSeleccion(grupos, regla, rutasSeleccionadas) {
  rutasSeleccionadas.clear();

  if (regla === 'desmarcar_todos') {
    return;
  }

  grupos.forEach(grupo => {
    if (!grupo.archivos || grupo.archivos.len < 2) return;

    if (regla === 'conservar_antiguo') {
      // Ordenar por fecha de modificación ascendente (el más antiguo primero)
      const ordenados = [...grupo.archivos].sort((a, b) => a.fecha_modificacion - b.fecha_modificacion);
      // El primero se conserva; los demás se marcan para eliminar
      for (let i = 1; i < ordenados.length; i++) {
        rutasSeleccionadas.add(ordenados[i].ruta);
      }
    } else if (regla === 'conservar_nuevo') {
      // Ordenar por fecha de modificación descendente (el más reciente primero)
      const ordenados = [...grupo.archivos].sort((a, b) => b.fecha_modificacion - a.fecha_modificacion);
      // El primero se conserva; los demás se marcan para eliminar
      for (let i = 1; i < ordenados.length; i++) {
        rutasSeleccionadas.add(ordenados[i].ruta);
      }
    } else if (regla === 'marcar_todos_menos_uno') {
      // Conservar el primer archivo de la lista original, marcar los demás
      for (let i = 1; i < grupo.archivos.length; i++) {
        rutasSeleccionadas.add(grupo.archivos[i].ruta);
      }
    }
  });
}

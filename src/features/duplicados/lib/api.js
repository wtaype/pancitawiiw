// src/features/duplicados/lib/api.js
// Invocaciones puente entre el frontend (widev) y los comandos Rust de duplicados (ridev)

/**
 * Inicia el escáner de duplicados en 3 etapas
 * @param {string[]} rutas Listado de carpetas a analizar
 * @param {number} [tamanoMinimoBytes=1024] Tamaño mínimo de archivo
 * @param {string[]} [extensiones=null] Lista de extensiones permitidas
 * @returns {Promise<Array>} Lista de grupos de duplicados encontrados
 */
export async function iniciarEscanerDuplicados(rutas, tamanoMinimoBytes = 1024, extensiones = null) {
  if (!window.__TAURI__) {
    console.warn('[Duplicados API] Tauri no detectado, usando entorno simulado.');
    return [];
  }
  return await window.__TAURI__.core.invoke('duplicados_iniciar_escaner', {
    rutas,
    tamanoMinimoBytes,
    extensionesPermitidas: extensiones && extensiones.length > 0 ? extensiones : null
  });
}

/**
 * Elimina de forma segura una lista de archivos enviándolos a la Papelera de Reciclaje
 * @param {string[]} rutas Lista de rutas de archivos a eliminar
 * @returns {Promise<number>} Cantidad de archivos eliminados con éxito
 */
export async function eliminarArchivosAPapelera(rutas) {
  if (!window.__TAURI__) return 0;
  return await window.__TAURI__.core.invoke('duplicados_eliminar_a_papelera', { rutas });
}

/**
 * Obtiene metadatos detallados de un archivo para el visor lateral y modales HD
 * @param {string} ruta Ruta del archivo
 * @returns {Promise<Object>} Metadata del archivo
 */
export async function obtenerMetadataArchivo(ruta) {
  if (!window.__TAURI__) return null;
  return await window.__TAURI__.core.invoke('duplicados_obtener_metadata_archivo', { ruta });
}

/**
 * Abre el selector nativo de carpetas de Windows (reutilizando seleccionar_carpeta_comando de ridev)
 * @param {string} titulo Título de la ventana de diálogo
 * @returns {Promise<string|null>} Ruta seleccionada o null
 */
export async function seleccionarCarpetaNativa(titulo = 'Seleccionar carpeta para buscar duplicados') {
  if (!window.__TAURI__) return null;
  return await window.__TAURI__.core.invoke('seleccionar_carpeta_comando', { titulo });
}

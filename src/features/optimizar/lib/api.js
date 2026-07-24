// src/features/optimizar/lib/api.js
// Capa de transporte asíncrona Tauri IPC hacia los motores nativos de Rust en optimizar/

export async function obtenerEstadoRam() {
  if (!window.__TAURI__) {
    return { total_mb: 16384, usado_mb: 8192, libre_mb: 8192, porcentaje_uso: 50.0 };
  }
  return await window.__TAURI__.core.invoke('optimizar_obtener_estado_ram');
}

export async function liberarRamTurbo() {
  if (!window.__TAURI__) {
    return 1024;
  }
  return await window.__TAURI__.core.invoke('optimizar_liberar_ram_turbo');
}

export async function vaciarPapeleraNativa() {
  if (!window.__TAURI__) {
    return true;
  }
  return await window.__TAURI__.core.invoke('optimizar_vaciar_papelera_nativa');
}

export async function escanearBasuraGeneral() {
  if (!window.__TAURI__) {
    return {
      categorias: [
        { id: 'temp_user', titulo: 'Archivos Temporales de Usuario', descripcion: 'Archivos temporales (%TEMP%)', bytes: 104857600, protegida: false, rutas: [] },
        { id: 'win_temp', titulo: 'Temporales del Sistema Windows', descripcion: 'Archivos temporales (C:\\Windows\\Temp)', bytes: 52428800, protegida: false, rutas: [] }
      ],
      total_bytes: 157286400
    };
  }
  return await window.__TAURI__.core.invoke('optimizar_escanear_basura_general');
}

export async function escanearBasuraProfundo() {
  if (!window.__TAURI__) {
    return {
      categorias: [
        { id: 'chrome_cache', titulo: 'Caché de Google Chrome', descripcion: 'Caché e imágenes del navegador', bytes: 209715200, protegida: false, rutas: [] },
        { id: 'downloads_dir', titulo: 'Carpeta de Descargas (Protegido)', descripcion: 'Archivos descargados. Desmarcado por seguridad.', bytes: 1073741824, protegida: true, rutas: [] }
      ],
      total_bytes: 1283457024
    };
  }
  return await window.__TAURI__.core.invoke('optimizar_escanear_basura_profundo');
}

export async function ejecutarLimpieza(rutas) {
  if (!rutas || rutas.length === 0) return 0;
  if (!window.__TAURI__) {
    return 157286400;
  }
  return await window.__TAURI__.core.invoke('optimizar_ejecutar_limpieza', { rutas });
}

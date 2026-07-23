// src/features/duplicados/lib/filtros.js
// Funciones helper para filtrado por categoría, tamaño, búsqueda por texto y formateo de bytes

export function filtrarGruposDuplicados(grupos, opciones = {}) {
  if (!grupos || !Array.isArray(grupos)) return [];

  const { categoria = 'todos', busqueda = '' } = opciones;
  const query = busqueda.trim().toLowerCase();

  return grupos.filter(grupo => {
    // 1. Filtrar por categoría (extensión)
    let pasaCategoria = true;
    if (categoria !== 'todos') {
      const extsPermitidas = getExtensionesPorCategoria(categoria);
      if (extsPermitidas) {
        pasaCategoria = grupo.archivos.some(arch => 
          extsPermitidas.includes((arch.extension || '').toLowerCase())
        );
      }
    }

    if (!pasaCategoria) return false;

    // 2. Filtrar por texto de búsqueda (nombre, ruta o extensión)
    if (query) {
      const coincideBusqueda = grupo.archivos.some(arch => 
        (arch.nombre || '').toLowerCase().includes(query) ||
        (arch.ruta || '').toLowerCase().includes(query) ||
        (arch.extension || '').toLowerCase().includes(query)
      );
      if (!coincideBusqueda) return false;
    }

    return true;
  });
}

export function formatearBytes(bytes, decimales = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimales < 0 ? 0 : decimales;
  const tamaños = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamaños[i];
}

function getExtensionesPorCategoria(cat) {
  switch (cat) {
    case 'imagenes': return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    case 'videos': return ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv'];
    case 'musica': return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    case 'documentos': return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'txt', 'html'];
    default: return null;
  }
}

// src/features/duplicados/duplicados.js
// Controlador SPA de /duplicados con Re-Escaneo Rápido (Top Right Button) y Buscador en Tiempo Real (Fase 1)

import { renderEscanerConfig } from './secciones/escaner_config.js';
import { renderResultadosLista } from './secciones/resultados_lista.js';
import { renderPanelDuplicados } from './componentes/panel_duplicados.js';
import { renderModalVisorHD } from './componentes/modal_visor_hd.js';
import { renderModalReglas } from './componentes/modal_reglas.js';
import { renderBarraAcciones } from './componentes/barra_acciones.js';
import { iniciarEscanerDuplicados, seleccionarCarpetaNativa, eliminarArchivosAPapelera } from './lib/api.js';
import { filtrarGruposDuplicados } from './lib/filtros.js';
import { aplicarReglaSeleccion } from './lib/reglas_seleccion.js';
import { renderMusica, bindMusicaEvents } from '@features/musica/musica.js';
import { Mensaje, Notificacion, wiSpin } from '@widev';
import './duplicados.css';

// Sub-tabs de la cabecera: Buscador interno + Actualizar | Agregar Carpeta en el lado derecho
export const TABS = [
  { id: 'escaner', label: 'Escáner y Configuración', icon: 'fa-folder-open', position: 'left', active: true },
  { id: 'resultados', label: 'Resultados y Duplicados', icon: 'fa-layer-group', position: 'left' },
  { id: 're_escanear_action', label: 'Actualizar resultados', icon: 'fa-arrows-rotate', position: 'right', iconOnly: true },
  { id: 'abrir_carpeta_action', label: 'Agregar Carpeta', icon: 'fa-folder-plus', position: 'right', iconOnly: true }
];

const TAMANO_PAGINA = 20;

export async function arrancar(container) {
  if (container._cleanupDuplicados) {
    container._cleanupDuplicados();
  }

  // Estado local del módulo
  const state = {
    rutas: [],
    grupos: [],
    gruposFiltrados: [],
    rutasSeleccionadas: new Set(),
    archivoSeleccionadoRuta: null,
    busquedaTexto: '',
    opcionesUltimas: { categoria: 'todos', tamanoKB: 0 },
    paginaActual: 1,
    cargando: false,
    tabActiva: 'escaner'
  };

  container.innerHTML = `
    <div class="dup_container">
      <div class="dup_wrap">
        <!-- Subsección 1: Escáner y Selección de Carpetas -->
        <div id="dup_section_escaner" class="dup_section_content active">
          <div id="dup_sec_config"></div>
        </div>

        <!-- Subsección 2: Lista de Resultados a 100% Ancho -->
        <div id="dup_section_resultados" class="dup_section_content">
          <div id="dup_sec_resultados" class="dup_resultados_wrapper"></div>
        </div>
      </div>
    </div>
  `;

  const configContainer = container.querySelector('#dup_sec_config');
  const resultadosContainer = container.querySelector('#dup_sec_resultados');

  // Render inicial del panel de configuración
  renderEscanerConfig(configContainer, state, async (opciones) => {
    state.opcionesUltimas = opciones;
    await ejecutarEscaneo(opciones);
  });

  async function ejecutarEscaneo(opciones) {
    if (state.rutas.length === 0) {
      Notificacion('Agrega al menos una carpeta para escanear', 'warning');
      return;
    }

    state.cargando = true;
    
    // Cambiar automáticamente a la pestaña de resultados al iniciar escaneo
    activarTab('resultados');

    resultadosContainer.innerHTML = `
      <div class="dup_empty_state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <h3>Escaneando archivos en 3 etapas...</h3>
        <p>Filtrando por tamaño, analizando cabeceras de 64KB y procesando hashes en paralelo con Rayon + Blake3.</p>
      </div>
    `;

    try {
      const extList = opciones.categoria !== 'todos' ? getExtensionesPorCategoria(opciones.categoria) : null;
      const resultados = await iniciarEscanerDuplicados(state.rutas, opciones.tamanoKB, extList);
      
      state.grupos = resultados || [];
      state.gruposFiltrados = filtrarGruposDuplicados(state.grupos, { 
        categoria: opciones.categoria, 
        busqueda: state.busquedaTexto 
      });
      state.rutasSeleccionadas.clear();
      state.archivoSeleccionadoRuta = null;
      state.paginaActual = 1;

      Notificacion(`Escaneo completado. ${state.gruposFiltrados.length} grupos de duplicados encontrados.`, 'success');
      actualizarVistasResultados();
    } catch (err) {
      console.error('[Duplicados] Error durante el escaneo:', err);
      resultadosContainer.innerHTML = `
        <div class="dup_empty_state">
          <i class="fa-solid fa-circle-exclamation dup_tab_text_danger"></i>
          <h3>Error en el escaneo</h3>
          <p>${err || 'Ocurrió un fallo inesperado al analizar las carpetas.'}</p>
        </div>
      `;
    } finally {
      state.cargando = false;
    }
  }

  function actualizarVistasResultados() {
    // Aplicar filtro combinado de categoría y texto de búsqueda
    state.gruposFiltrados = filtrarGruposDuplicados(state.grupos, { 
      categoria: state.opcionesUltimas.categoria, 
      busqueda: state.busquedaTexto 
    });

    renderResultadosLista(
      resultadosContainer,
      state.gruposFiltrados,
      state.rutasSeleccionadas,
      state.paginaActual,
      TAMANO_PAGINA,
      state.busquedaTexto,
      (nuevoTexto) => {
        state.busquedaTexto = nuevoTexto;
        state.paginaActual = 1;
        actualizarVistasResultados();
      },
      (ruta) => {
        // Al hacer clic en un archivo, reemplazar TEMPORALMENTE el reproductor de música en el sidebar derecho
        state.archivoSeleccionadoRuta = ruta;
        const sidebarWrapper = document.getElementById('sidebar_musica_wrapper');
        if (sidebarWrapper) {
          renderPanelDuplicados(
            sidebarWrapper, 
            ruta, 
            () => {
              state.archivoSeleccionadoRuta = null;
              restaurarMusicaEnSidebar();
            },
            (meta) => renderModalVisorHD(meta)
          );
        }
      },
      (ruta, estaMarcado) => {
        if (estaMarcado) {
          state.rutasSeleccionadas.add(ruta);
        } else {
          state.rutasSeleccionadas.delete(ruta);
        }
        actualizarVistasResultados();
      },
      (nuevaPagina) => {
        state.paginaActual = nuevaPagina;
        actualizarVistasResultados();
        resultadosContainer.scrollIntoView({ behavior: 'smooth' });
      }
    );

    // Actualizar o renderizar la barra flotante de acciones (Papelera)
    renderBarraAcciones(
      container,
      state.rutasSeleccionadas,
      state.gruposFiltrados,
      () => {
        renderModalReglas((regla) => {
          aplicarReglaSeleccion(state.gruposFiltrados, regla, state.rutasSeleccionadas);
          actualizarVistasResultados();
          Mensaje('Regla de auto-selección aplicada', 'info');
        });
      },
      async () => {
        const rutasAEliminar = Array.from(state.rutasSeleccionadas);
        try {
          const eliminados = await eliminarArchivosAPapelera(rutasAEliminar);
          Notificacion(`¡${eliminados} archivo(s) movidos exitosamente a la Papelera de Reciclaje!`, 'success');
          
          state.grupos.forEach(grupo => {
            grupo.archivos = grupo.archivos.filter(a => !rutasAEliminar.includes(a.ruta));
          });
          state.grupos = state.grupos.filter(g => g.archivos.length >= 2);
          state.gruposFiltrados = state.grupos;
          state.rutasSeleccionadas.clear();
          state.archivoSeleccionadoRuta = null;

          restaurarMusicaEnSidebar();
          actualizarVistasResultados();
        } catch (errElim) {
          console.error('[Duplicados] Error al eliminar archivos:', errElim);
          Notificacion(`Error al eliminar: ${errElim}`, 'error');
        }
      }
    );
  }

  function restaurarMusicaEnSidebar() {
    const sidebarWrapper = document.getElementById('sidebar_musica_wrapper');
    if (sidebarWrapper) {
      sidebarWrapper.innerHTML = renderMusica();
      bindMusicaEvents(sidebarWrapper);
    }
  }

  function activarTab(tabId) {
    state.tabActiva = tabId;
    container.querySelectorAll('.dup_section_content').forEach(sect => {
      if (sect.id === `dup_section_${tabId}`) {
        sect.classList.add('active');
      } else {
        sect.classList.remove('active');
      }
    });

    const tabsWrapper = document.getElementById('wimain_tabs_wrapper');
    if (tabsWrapper) {
      tabsWrapper.querySelectorAll('.wi_subtab_btn').forEach(btn => {
        if (btn.getAttribute('data-subtab') === tabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  // Event Listeners de Sub-tabs globales (tabs.js)
  const handleSubtabChange = (e) => {
    const subtabId = e.detail.subtabId;
    if (['escaner', 'resultados'].includes(subtabId)) {
      activarTab(subtabId);
    }
  };

  const handleSubtabAction = async (e) => {
    const actionId = e.detail.actionId;

    if (actionId === 'abrir_carpeta_action') {
      const ruta = await seleccionarCarpetaNativa();
      if (ruta && !state.rutas.includes(ruta)) {
        state.rutas.push(ruta);
        renderEscanerConfig(configContainer, state, async (opciones) => {
          state.opcionesUltimas = opciones;
          await ejecutarEscaneo(opciones);
        });
        Notificacion(`Carpeta agregada: ${ruta}`, 'info');
      }
    } else if (actionId === 're_escanear_action') {
      const btnRef = document.querySelector('[data-action-id="re_escanear_action"]');
      if (btnRef && typeof wiSpin === 'function') wiSpin(btnRef, true);

      try {
        await ejecutarEscaneo(state.opcionesUltimas);
        Notificacion('Resultados de duplicados actualizados', 'success');
      } finally {
        if (btnRef && typeof wiSpin === 'function') wiSpin(btnRef, false);
      }
    }
  };

  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);

  container._cleanupDuplicados = () => {
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
    const barra = container.querySelector('#dup_barra_acciones_root');
    if (barra) barra.remove();

    restaurarMusicaEnSidebar();
  };
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

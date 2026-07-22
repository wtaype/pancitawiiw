// src/features/musica/componentes/panel.js
// Orquestador Principal del Panel de Biblioteca de Música (In-Page)

import { renderRutaLocalHTML, bindRutaLocalEvents } from './ruta_local.js';
import { renderRutaYoutubeHTML, bindRutaYoutubeEvents } from './ruta_youtube.js';
import { rutas } from '@core/rutas.js';
import { wiTip } from '@core/widev/witip.js';

export function arrancarPanel(panel, {
  carpetasGuardadas,
  carpetaActivaId,
  combinarRutas,
  combinarTodas,
  onSeleccionarNuevaCarpeta,
  onActivarCarpeta,
  onEliminarCarpeta,
  onToggleCombine,
  onToggleCombineAll,
  onDescargaCompletada
}) {
  let activeTab = 'local'; // 'local' | 'youtube' | 'ajustes'
  
  // Encontrar la carpeta activa para pasar su nombre y ruta
  const carpetaActiva = carpetasGuardadas.find(c => c.id === carpetaActivaId) || carpetasGuardadas[0];
  const carpetaActivaNombre = (carpetaActiva && carpetaActiva.id !== 'default') 
    ? carpetaActiva.nombre 
    : 'Carpeta de Música del Sistema (Por defecto)';
  const carpetaActivaRuta = carpetaActiva ? (carpetaActiva.ruta_raiz || carpetaActiva.nombre) : '';

  const renderLayout = () => {
    panel.innerHTML = `
      <div class="msc_panel_layout">
        <!-- Columna Izquierda: Pestañas -->
        <aside class="msc_panel_sidebar">
          <button class="msc_sidebar_tab_btn ${activeTab === 'local' ? 'active' : ''}" data-tab="local">
            <i class="fa-solid fa-folder-tree"></i> Carpetas Locales
          </button>
          <button class="msc_sidebar_tab_btn ${activeTab === 'youtube' ? 'active' : ''}" data-tab="youtube">
            <i class="fa-brands fa-youtube"></i> Descargar YouTube
          </button>
          <button class="msc_sidebar_tab_btn ${activeTab === 'ajustes' ? 'active' : ''}" data-tab="ajustes">
            <i class="fa-solid fa-sliders"></i> Ajustes de Biblioteca
          </button>
          
          <div class="msc_sidebar_spacer"></div>
          
          <!-- Botón de Salida -->
          <button id="msc_panel_btn_exit" class="msc_panel_exit_btn">
            <i class="fa-solid fa-arrow-left"></i> Volver a Inicio
          </button>
        </aside>

        <!-- Columna Derecha: Contenido Activo -->
        <main class="msc_panel_body" id="msc_panel_active_content">
          ${renderActiveContent()}
        </main>
      </div>
    `;
    
    bindLayoutEvents();
  };

  const renderActiveContent = () => {
    if (activeTab === 'local') {
      return renderRutaLocalHTML(carpetasGuardadas, carpetaActivaId, combinarTodas);
    } else if (activeTab === 'youtube') {
      return renderRutaYoutubeHTML(carpetaActivaNombre);
    } else if (activeTab === 'ajustes') {
      return `
        <div class="msc_subpanel_title">
          <i class="fa-solid fa-sliders"></i> Ajustes de Biblioteca
        </div>
        
        <div class="msc_settings_panel">
          
          <!-- Ajuste 1: Combinar carpetas al importar -->
          <div class="msc_setting_row">
            <div class="msc_setting_info">
              <span class="msc_setting_title">Combinar carpetas al importar</span>
              <span class="msc_setting_desc">Añade los temas escaneados de nuevas carpetas a la lista activa en lugar de sobreescribirla.</span>
            </div>
            <label class="msc_ios_switch">
              <input type="checkbox" id="msc_opt_combine" ${combinarRutas ? 'checked' : ''} />
              <span class="msc_ios_slider"></span>
            </label>
          </div>

          <!-- Ajuste 2: Combinar todas las carpetas agregadas -->
          <div class="msc_setting_row">
            <div class="msc_setting_info">
              <span class="msc_setting_title">Fusión Completa (Combinar todas)</span>
              <span class="msc_setting_desc">Une automáticamente todas las canciones de todas las carpetas en una única playlist global.</span>
            </div>
            <label class="msc_ios_switch">
              <input type="checkbox" id="msc_opt_combine_all" ${combinarTodas ? 'checked' : ''} />
              <span class="msc_ios_slider"></span>
            </label>
          </div>

        </div>
      `;
    }
    return '';
  };

  const bindLayoutEvents = () => {
    // 1. Alternar Pestañas
    const tabs = panel.querySelectorAll('.msc_sidebar_tab_btn');
    tabs.forEach(tab => {
      tab.onclick = () => {
        activeTab = tab.dataset.tab;
        renderLayout();
      };
    });

    // 2. Salir / Volver a Inicio
    const exitBtn = panel.querySelector('#msc_panel_btn_exit');
    if (exitBtn) {
      exitBtn.onclick = () => {
        rutas.navegar('/inicio');
      };
    }

    // 3. Vincular Eventos de Subcomponentes
    const subContainer = panel.querySelector('#msc_panel_active_content');
    if (activeTab === 'local') {
      bindRutaLocalEvents(subContainer, {
        onSeleccionarNuevaCarpeta: (canciones, nombre, ruta) => {
          onSeleccionarNuevaCarpeta(canciones, nombre, ruta);
          renderLayout();
        },
        onActivarCarpeta: (folderId) => {
          onActivarCarpeta(folderId);
          renderLayout();
        },
        onEliminarCarpeta: (folderId) => {
          onEliminarCarpeta(folderId);
          renderLayout();
        }
      });
    } else if (activeTab === 'youtube') {
      bindRutaYoutubeEvents(subContainer, carpetaActivaRuta, (cancion) => {
        onDescargaCompletada(cancion);
        renderLayout();
      });
    } else if (activeTab === 'ajustes') {
      const toggleCombine = subContainer.querySelector('#msc_opt_combine');
      if (toggleCombine) {
        toggleCombine.onchange = (e) => {
          combinarRutas = e.target.checked;
          onToggleCombine(combinarRutas);
        };
      }

      const toggleCombineAll = subContainer.querySelector('#msc_opt_combine_all');
      if (toggleCombineAll) {
        toggleCombineAll.onchange = (e) => {
          combinarTodas = e.target.checked;
          onToggleCombineAll(combinarTodas);
        };
      }
    }
  };

  renderLayout();
}

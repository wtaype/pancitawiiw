// src/features/optimizar/optimizar.js
// Controlador SPA principal del módulo Optimizar (Salud RAM, Limpieza General y Limpieza Profunda)

import { renderSaludRam } from './secciones/salud_ram.js';
import { renderLimpiezaGeneral } from './secciones/limpieza_general.js';
import { renderLimpiezaProfundo } from './secciones/limpieza_profundo.js';
import { renderMusica, bindMusicaEvents } from '@features/musica/musica.js';
import { wiTip, savels, getls } from '@widev';
import './optimizar.css';

export const TABS = [
  { id: 'salud', label: 'Salud y Memoria RAM', icon: 'fa-gauge-high', position: 'left', active: true },
  { id: 'general', label: 'Limpieza General', icon: 'fa-broom', position: 'left' },
  { id: 'profundo', label: 'Limpieza Profunda', icon: 'fa-user-shield', position: 'left' }
];

export async function arrancar(container) {
  if (container._cleanupOptimizar) {
    container._cleanupOptimizar();
  }

  const state = {
    subtabActiva: 'salud'
  };

  container.innerHTML = `
    <div class="opt_container">
      <div class="opt_wrap">
        <!-- Subsección 1: Salud y Memoria RAM -->
        <div id="opt_section_salud" class="opt_section_content active">
          <div id="opt_sec_salud_root"></div>
        </div>

        <!-- Subsección 2: Limpieza General -->
        <div id="opt_section_general" class="opt_section_content">
          <div id="opt_sec_general_root"></div>
        </div>

        <!-- Subsección 3: Limpieza Profunda -->
        <div id="opt_section_profundo" class="opt_section_content">
          <div id="opt_sec_profundo_root"></div>
        </div>
      </div>
    </div>
  `;

  const secSaludRoot = container.querySelector('#opt_sec_salud_root');
  const secGeneralRoot = container.querySelector('#opt_sec_general_root');
  const secProfundoRoot = container.querySelector('#opt_sec_profundo_root');

  // Renderizar secciones activas
  renderSaludRam(secSaludRoot);
  renderLimpiezaGeneral(secGeneralRoot);
  renderLimpiezaProfundo(secProfundoRoot);

  function activarSubtab(subtabId) {
    state.subtabActiva = subtabId;
    container.querySelectorAll('.opt_section_content').forEach(sect => {
      if (sect.id === `opt_section_${subtabId}`) {
        sect.classList.add('active');
      } else {
        sect.classList.remove('active');
      }
    });

    const tabsWrapper = document.getElementById('wimain_tabs_wrapper');
    if (tabsWrapper) {
      tabsWrapper.querySelectorAll('.tab_left_item, .wi_subtab_btn').forEach(btn => {
        const idAttr = btn.getAttribute('data-subtab-id') || btn.getAttribute('data-subtab');
        if (idAttr === subtabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  const handleSubtabChange = (e) => {
    const subtabId = e.detail.subtabId;
    if (['salud', 'general', 'profundo'].includes(subtabId)) {
      activarSubtab(subtabId);
    }
  };

  document.addEventListener('wi_subtab_change', handleSubtabChange);

  container._cleanupOptimizar = () => {
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    if (secSaludRoot._cleanupSaludRam) secSaludRoot._cleanupSaludRam();
  };
}

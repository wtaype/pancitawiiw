// src/features/ajustes/ajustes.js
// Orquestador principal de sub-pestañas horizontal para el feature de Ajustes

import './ajustes.css';

let tabActiva = 'general';
const cargados = new Set();

export const TABS = [
  { id: 'general', label: 'General', icon: 'fa-gears', position: 'left', active: true },
  { id: 'acerca', label: 'Acerca', icon: 'fa-circle-info', position: 'left' },
  { id: 'privacidad', label: 'Privacidad', icon: 'fa-user-shield', position: 'left' },
  { id: 'terminos', label: 'Términos', icon: 'fa-file-signature', position: 'left' },
  { id: 'versiones', label: 'Versiones', icon: 'fa-code-branch', position: 'left' },
  { id: 'actualizar_ajustes_action', label: 'Actualizar', icon: 'fa-arrows-rotate', position: 'right', iconOnly: true }
];

export function arrancar(container) {
  // Limpiar listeners previos si existen
  if (container._cleanupAjustes) {
    container._cleanupAjustes();
  }

  tabActiva = 'general';
  cargados.clear();

  container.innerHTML = `
    <div class="ajustes_container">
      <div id="ajustes_section_general" class="ajustes_section_content active"></div>
      <div id="ajustes_section_acerca" class="ajustes_section_content"></div>
      <div id="ajustes_section_privacidad" class="ajustes_section_content"></div>
      <div id="ajustes_section_terminos" class="ajustes_section_content"></div>
      <div id="ajustes_section_versiones" class="ajustes_section_content"></div>
    </div>
  `;

  const cargarSubseccion = async (tabId, force = false) => {
    const panel = container.querySelector(`#ajustes_section_${tabId}`);
    if (!panel) return;

    if (!force && cargados.has(tabId)) {
      return; // Ya cargado y sin forzar recarga
    }

    panel.innerHTML = `
      <div class="ajustes_loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando...
      </div>
    `;

    try {
      const modulo = await import(`./secciones/${tabId}.js`);
      if (modulo.arrancar) {
        panel.innerHTML = '';
        modulo.arrancar(panel);
        cargados.add(tabId);
      }
    } catch (err) {
      console.error(`[Ajustes] Error al cargar subsección ${tabId}:`, err);
      panel.innerHTML = `<div class="ajustes_error">Error al cargar la sección.</div>`;
    }
  };

  const handleSubtabChange = (e) => {
    const subtabId = e.detail.subtabId;
    if (['general', 'acerca', 'privacidad', 'terminos', 'versiones'].includes(subtabId)) {
      tabActiva = subtabId;
      
      // Mostrar/ocultar secciones en el DOM
      container.querySelectorAll('.ajustes_section_content').forEach(sect => {
        if (sect.id === `ajustes_section_${subtabId}`) {
          sect.classList.add('active');
        } else {
          sect.classList.remove('active');
        }
      });

      cargarSubseccion(subtabId);
    }
  };

  const handleSubtabAction = (e) => {
    const actionId = e.detail.actionId;
    if (actionId === 'actualizar_ajustes_action') {
      cargarSubseccion(tabActiva, true);
    }
  };

  // Registrar listeners globales
  document.addEventListener('wi_subtab_change', handleSubtabChange);
  document.addEventListener('wi_subtab_action', handleSubtabAction);

  // Cargar sección inicial por defecto
  cargarSubseccion('general');

  // Guardar función de limpieza
  container._cleanupAjustes = () => {
    document.removeEventListener('wi_subtab_change', handleSubtabChange);
    document.removeEventListener('wi_subtab_action', handleSubtabAction);
  };
}

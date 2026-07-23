// src/core/componentes/tabs.js
// Componente dynamic tabs (pestañas) para organizar secciones internas de pancitawii con soporte para contenido customHtml libre

export const tabsComponent = {
  render(subtabs = []) {
    if (subtabs.length === 0) {
      return '';
    }

    const subtabsLeft = subtabs.filter(t => t.position === 'left' || !t.position);
    const subtabsRight = subtabs.filter(t => t.position === 'right');

    if (subtabsLeft.length === 0 && subtabsRight.length === 0) {
      return '';
    }

    let html = `
      <div class="tabs_bar_container">
        <!-- 1. Navegación de Sub-Secciones (tab-left) -->
        <div class="tab_left_wrapper">
    `;

    subtabsLeft.forEach(tab => {
      const activeClass = tab.active ? 'active' : '';
      const labelText = tab.iconOnly ? '' : ` <span>${tab.label}</span>`;
      const witipAttr = tab.iconOnly ? ` data-witip="${tab.label}"` : '';
      html += `
        <button class="tab_left_item ${activeClass}" data-subtab-id="${tab.id}"${witipAttr}>
          <i class="fa-solid ${tab.icon}"></i>${labelText}
        </button>
      `;
    });

    html += `
        </div>

        <!-- 2. Botones de Acción y Controles Libres (tab-right) -->
        <div class="tab_right_wrapper">
    `;

    subtabsRight.forEach(btn => {
      if (btn.type === 'custom' || btn.customHtml) {
        html += btn.customHtml || '';
      } else {
        const labelText = btn.iconOnly ? '' : ` <span>${btn.label}</span>`;
        const extraClass = btn.iconOnly ? 'icon_only' : '';
        const witipAttr = btn.iconOnly ? ` data-witip="${btn.label}"` : '';
        html += `
          <button class="tab_right_btn ${extraClass}" data-action-id="${btn.id}"${witipAttr}>
            <i class="fa-solid ${btn.icon}"></i>${labelText}
          </button>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    return html;
  },

  bindEvents(container, route) {
    const leftItems = container.querySelectorAll('.tab_left_item');
    leftItems.forEach(item => {
      item.addEventListener('click', () => {
        leftItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        const subtabId = item.getAttribute('data-subtab-id');
        const event = new CustomEvent('wi_subtab_change', {
          detail: { subtabId, route }
        });
        document.dispatchEvent(event);
      });
    });

    const rightBtns = container.querySelectorAll('.tab_right_btn');
    rightBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.getAttribute('data-action-id');

        const event = new CustomEvent('wi_subtab_action', {
          detail: { actionId, route }
        });
        document.dispatchEvent(event);
      });
    });
  }
};

export default tabsComponent;

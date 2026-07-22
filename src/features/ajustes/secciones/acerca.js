// src/features/ajustes/secciones/acerca.js
// Sub-pestaña Acerca de Pancitawii — Información general, créditos y tecnologías

import wii from '../../../wii.js';
import './acerca.css';

export function arrancar(container) {
  container.innerHTML = `
    <div class="acerca_section_wrap">
      <div class="ajustes_card acerca_brand_card">
        <div class="acerca_logo_area">
          <div class="acerca_logo_circle">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h2 class="acerca_app_name">${wii.app}</h2>
          <span class="acerca_app_version">Versión ${wii.versionName}</span>
        </div>
        
        <p class="acerca_app_desc">${wii.descri}</p>
        
        <div class="acerca_meta_grid">
          <div class="acerca_meta_item">
            <span class="acerca_meta_lbl">Desarrollado por</span>
            <a href="${wii.linkme}" target="_blank" class="acerca_meta_val link_me">${wii.by}</a>
          </div>
          <div class="acerca_meta_item">
            <span class="acerca_meta_lbl">Lanzamiento</span>
            <span class="acerca_meta_val">${wii.lanzamiento}</span>
          </div>
          <div class="acerca_meta_item">
            <span class="acerca_meta_lbl">Sitio Web</span>
            <a href="${wii.linkweb}" target="_blank" class="acerca_meta_val link_web">${wii.linkweb.replace('https://', '')}</a>
          </div>
        </div>
      </div>

      <div class="ajustes_card acerca_credits_card">
        <h4 class="acerca_credits_title"><i class="fa-solid fa-graduation-cap"></i> Créditos y Tecnologías</h4>
        <div class="acerca_tech_tags">
          <span class="tech_tag rust"><i class="fa-brands fa-rust"></i> Rust (Tauri Core)</span>
          <span class="tech_tag js"><i class="fa-brands fa-js"></i> JavaScript ES6</span>
          <span class="tech_tag css"><i class="fa-brands fa-css3-alt"></i> Vanilla CSS</span>
          <span class="tech_tag tauri"><i class="fa-solid fa-rocket"></i> Tauri v2</span>
          <span class="tech_tag gemini"><i class="fa-solid fa-brain"></i> Google Gemini API</span>
        </div>
        <p class="acerca_credits_desc">
          Creado con amor para impulsar la productividad diaria y la concentración del usuario.
        </p>
      </div>
    </div>
  `;
}

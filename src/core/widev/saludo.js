// src/lib/widev/saludo.js
// Saludar v12.0: Saludos inteligentes localizados — funciona en servidor (SSG/SSR) y cliente (SPA)
// En servidor: pasar Astro.locals.lang o lang string. En cliente: langwii lee window.__l (0ms).

import { langwii } from './langwii.js';

export const Saludar = (nombre = '', lang = '') => {
  const hrs  = new Date().getHours();
  const isEn = langwii.esEn(lang);
  const saludo = hrs < 12
    ? (isEn ? 'Good morning'   : 'Buenos días')
    : hrs < 18
      ? (isEn ? 'Good afternoon' : 'Buenas tardes')
      : (isEn ? 'Good evening'   : 'Buenas noches');
  return nombre ? `${saludo}, ${nombre}` : `${saludo},`;
};
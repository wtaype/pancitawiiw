// src/core/seo.js
// Registro global de metadatos de primer nivel para la cabecera e indicadores de posición

export const SEO = {
  '/inicio': {
    tag: 'Inicio',
    title: 'Panel Principal',
    subtitle: 'Bienvenido a pancitawii · Asistente Diario',
    icon: 'fa-house',
    position: 'left'
  },
  '/horario': {
    tag: 'Horario',
    title: 'Horario Semanal',
    subtitle: 'Rutinas Diarias, Materias y Actividades',
    icon: 'fa-calendar-days',
    position: 'left'
  },
  '/chat': {
    tag: 'ChatWii',
    title: 'Asistente ChatWii',
    subtitle: 'Inteligencia Artificial pancitawii',
    icon: 'fa-robot',
    position: 'left'
  },
  '/ajustes': {
    tag: 'Ajustes',
    title: 'Ajustes del Sistema',
    subtitle: 'Personalización y Preferencias',
    icon: 'fa-gear',
    position: 'right'
  },
  '/acerca': {
    tag: 'Acerca',
    title: 'Sobre pancitawii',
    subtitle: 'Créditos y Versión',
    icon: 'fa-info-circle',
    position: 'right'
  }
};

export const SEO_DEFAULT = SEO['/inicio'];

export const getMeta = (path) => SEO[path] ?? SEO_DEFAULT;

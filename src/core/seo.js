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
  '/duplicados': {
    tag: 'Duplicados',
    title: 'Buscador de Archivos Duplicados',
    subtitle: 'Escáner ultrarrápido y gestión de espacio',
    icon: 'fa-copy',
    position: 'left'
  },
  '/optimizar': {
    tag: 'Optimizar',
    title: 'Centro de Optimización',
    subtitle: 'Limpieza profunda y rendimiento del PC',
    icon: 'fa-gauge-high',
    position: 'left'
  },
  '/cuenta': {
    tag: 'Cuenta',
    title: 'Mi Cuenta',
    subtitle: 'Gestión de Perfil y Preferencias',
    icon: 'fa-user-gear',
    position: 'right'
  },
  '/ajustes': {
    tag: 'Ajustes',
    title: 'Ajustes del Sistema',
    subtitle: 'Personalización y Preferencias',
    icon: 'fa-gear',
    position: 'right'
  },
  '/actualizar': {
    tag: 'Actualizaciones',
    title: 'Actualizador de Sistema',
    subtitle: 'Novedades, Control de Versión y Parches',
    icon: 'fa-cloud-arrow-down',
    position: 'hidden'
  },
};

export const SEO_DEFAULT = SEO['/inicio'];

export const getMeta = (path) => SEO[path] ?? SEO_DEFAULT;

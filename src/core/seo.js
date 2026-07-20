// src/core/seo.js
// Diccionario centralizado de SEO, metadatos y configuración visual de rutas para pancitawii

export const SEO = {
  '/inicio': {
    tag: 'Inicio',
    title: 'Panel Principal',
    subtitle: 'Bienvenido a pancitawii · Asistente Diario',
    icon: 'fa-house',
    desc: 'Panel principal con bienvenida, fecha en vivo y accesos directos.'
  },
  '/reloj': {
    tag: 'Reloj',
    title: 'Reloj Digital & Cronómetro',
    subtitle: 'Reloj Neón, Temporizador y Control de Horarios',
    icon: 'fa-clock',
    desc: 'Visualiza la hora actual en tiempo real, activa temporizadores y cronómetros.'
  },
  '/horario': {
    tag: 'Horario',
    title: 'Horario Semanal',
    subtitle: 'Rutinas Diarias, Materias y Actividades',
    icon: 'fa-calendar-days',
    desc: 'Gestión organizada del horario diario y semanal de actividades.'
  },
  '/chat': {
    tag: 'ChatWii',
    title: 'Pancita Asistente',
    subtitle: 'Asistente Inteligente de Productividad y Respuestas',
    icon: 'fa-robot',
    desc: 'Tu compañero para organizar tu día, responder dudas y recordatorios.'
  },
  '/ajustes': {
    tag: 'Ajustes',
    title: 'Configuración y Ajustes',
    subtitle: 'Anti-Suspensión, Temas Visuales y Sistema',
    icon: 'fa-gear',
    desc: 'Personaliza los temas de color y activa la pantalla siempre despierta.'
  },
  '/acerca': {
    tag: 'Acerca',
    title: 'Acerca de pancitawii',
    subtitle: 'Información del Sistema y Créditos',
    icon: 'fa-info-circle',
    desc: 'Información sobre la versión, tecnologías y desarrollador.'
  }
};

export const SEO_DEFAULT = {
  tag: 'App',
  title: 'pancitawii',
  subtitle: 'Horario, Reloj Digital y Asistente',
  icon: 'fa-clock',
  desc: 'Aplicativo modular de escritorio pancitawii'
};

export default SEO;

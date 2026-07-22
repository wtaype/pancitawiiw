// src/features/chatwii/lib/seguridad.js
// Validador de entrada, prevención de XSS y control de bloqueos temporales para ChatWii Windows
// Adaptado y homologado con el proyecto Workwii

import { wiRateLimit } from '@widev';

const PALABRAS_PROHIBIDAS = [
  '<script',
  'javascript:',
  'fetch(',
  'ajax(',
  'XMLHttpRequest',
  'eval(',
  'execCommand',
  'document.write',
  'onload=',
  'onerror=',
  'onclick=',
  'localStorage',
  'sessionStorage',
  'cookie'
];

const LIMIT_KEY = '_blocked_chat_listo';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 86400000; // 24 horas

export const contieneCodigoProhibido = (texto) => {
  if (!texto) return false;
  
  const textoMinuscula = texto.toLowerCase();
  
  for (const palabra of PALABRAS_PROHIBIDAS) {
    if (textoMinuscula.includes(palabra.toLowerCase())) {
      return true;
    }
  }

  const inyeccionScript = /<iframe|<embed|<object|<applet/gi;
  if (inyeccionScript.test(textoMinuscula)) {
    return true;
  }

  return false;
};

export const escaparHtml = (texto) => {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const estaBloqueadoTemporalmente = () => {
  if (typeof window === 'undefined') return false;
  const rate = wiRateLimit(LIMIT_KEY, MAX_ATTEMPTS, LOCKOUT_MS);
  return !rate.ok;
};

export const registrarIntentoBloqueo = () => {
  if (typeof window === 'undefined') return;
  const rate = wiRateLimit(LIMIT_KEY, MAX_ATTEMPTS, LOCKOUT_MS);
  rate.fail();
};

export const obtenerTiempoBloqueoRestante = () => {
  if (typeof window === 'undefined') return '';
  const rate = wiRateLimit(LIMIT_KEY, MAX_ATTEMPTS, LOCKOUT_MS);
  if (rate.ok) return '';
  
  const totalMin = rate.min;
  if (totalMin >= 60) {
    const horas = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (horas === 24 && mins === 0) return '24 horas';
    return `${horas}h y ${mins}m`;
  }
  return `${totalMin} minutos`;
};

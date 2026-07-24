// src/features/actualizar/lib/auto_checker.js
// Subservicio modular: Verificador inteligente en segundo plano de actualizaciones para Pancitawii

import { getls, savels } from '@core/widev/storage.js';

export function comprobarActualizacionSilenciosa(updateBtn) {
  if (!updateBtn) return;

  // 1. Revisar caché local con key 'check_update' (expiración controlada de 6 horas)
  const cacheInfo = getls('check_update');
  if (cacheInfo && typeof cacheInfo === 'object') {
    if (cacheInfo.hasUpdate) {
      updateBtn.classList.add('has_update');
      updateBtn.setAttribute('title', `¡Nueva versión disponible! (${cacheInfo.versionNueva || ''})`);
    } else {
      updateBtn.classList.remove('has_update');
    }
    return;
  }

  // 2. Si no hay caché o expiró, diferir la consulta 15 segundos para no afectar el arranque
  setTimeout(async () => {
    try {
      let versionActual = '2.8.0';
      if (typeof window !== 'undefined' && window.__TAURI__) {
        const core = window.__TAURI__.core || window.__TAURI__.tauri;
        if (core && typeof core.invoke === 'function') {
          const ver = await core.invoke('actualizador_obtener_version_actual');
          if (ver) versionActual = ver;
        }
      }

      const res = await fetch('https://api.github.com/repos/wtaype/pancitawiiw/releases/latest');
      if (!res.ok) return;

      const release = await res.json();
      const versionNueva = release.tag_name || 'v0.0.0';
      const tieneNuevaVersion = esVersionNueva(versionActual, versionNueva);

      // Guardar objeto en localStorage con clave 'check_update' y expiración de 6 horas
      savels('check_update', {
        versionNueva,
        versionActual,
        hasUpdate: tieneNuevaVersion,
        timestamp: Date.now()
      }, 6);

      if (tieneNuevaVersion) {
        updateBtn.classList.add('has_update');
        updateBtn.setAttribute('title', `¡Nueva versión disponible! (${versionNueva})`);
      } else {
        updateBtn.classList.remove('has_update');
      }
    } catch (err) {
      console.warn('[AutoUpdate] Error en comprobación en segundo plano:', err);
    }
  }, 15000);
}

export function esVersionNueva(versionActual, versionNueva) {
  const vA = (versionActual || '0.0.0').replace(/^v/, '').split('.').map(Number);
  const vN = (versionNueva || '0.0.0').replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(vA.length, vN.length); i++) {
    const numA = vA[i] || 0;
    const numN = vN[i] || 0;
    if (numN > numA) return true;
    if (numN < numA) return false;
  }
  return false;
}

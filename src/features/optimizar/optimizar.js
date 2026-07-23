// src/features/optimizar/optimizar.js
// Módulo de Optimización de Memoria RAM y Limpieza del Sistema (Parte 2)

import { wiTip } from '@widev';
import './optimizar.css';

export const TABS = [
  { id: 'salud', label: 'Salud y Memoria RAM', icon: 'fa-gauge-high', position: 'left', active: true },
  { id: 'limpieza', label: 'Limpieza de Basura', icon: 'fa-broom', position: 'left' }
];

export async function arrancar(container) {
  container.innerHTML = `
    <div class="opt_container">
      <div class="opt_wrap">
        <div class="opt_hero_card">
          <i class="fa-solid fa-rocket"></i>
          <h2>Centro de Optimización de Sistema y Memoria RAM</h2>
          <p>Preparando los motores de liberación Turbo RAM (Win32 EmptyWorkingSet) y Limpiador de la Papelera de Reciclaje.</p>
        </div>
      </div>
    </div>
  `;

  if (typeof wiTip === 'function') wiTip();
}

// src/features/chatwii/lib/estado_chat.js
// Gestor de estado reactivo, historial y persistencia de ChatWii

import { getls, savels } from '@widev';

let _historial = [];

export const initEstadoChat = async () => {
  if (window.__TAURI__) {
    try {
      const saved = await window.__TAURI__.core.invoke('chatwii_cargar_historial');
      _historial = Array.isArray(saved) ? saved : [];
    } catch (err) {
      console.error('[EstadoChat] Error al cargar historial desde Rust:', err);
      _historial = [];
    }
  } else {
    try {
      const saved = getls('chatwii_history_pancita');
      _historial = Array.isArray(saved) ? saved : [];
    } catch (_) {
      _historial = [];
    }
  }
  return _historial;
};

export const obtenerHistorial = () => _historial;

export const guardarHistorial = async () => {
  if (window.__TAURI__) {
    try {
      await window.__TAURI__.core.invoke('chatwii_guardar_historial', { historial: _historial });
    } catch (err) {
      console.error('[EstadoChat] Error al guardar historial en Rust:', err);
    }
  } else {
    try {
      savels('chatwii_history_pancita', _historial, null);
    } catch (_) {}
  }
};

export const limpiarHistorial = async () => {
  _historial = [];
  await guardarHistorial();
};

export const agregarMensajeUser = async (parts) => {
  _historial.push({ role: 'user', parts });
  await guardarHistorial();
};

export const agregarMensajeModel = async (textoCompleto) => {
  _historial.push({ role: 'model', parts: [{ text: textoCompleto }] });
  await guardarHistorial();
};

export const removerUltimoMensaje = async () => {
  _historial.pop();
  await guardarHistorial();
};

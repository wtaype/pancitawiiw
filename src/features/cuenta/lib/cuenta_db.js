// src/features/cuenta/lib/cuenta_db.js
// Servicio local de base de datos para la gestión del perfil del usuario (Firebase-ready)

import { getls, savels } from '@widev';

// Clave en localStorage para compatibilidad
const CLAVE_STORAGE = 'wiSmile';
const HORAS_EXPIRACION = 87600; // 10 años para simular persistencia permanente

// Datos iniciales por defecto (Principal Pancita Good)
const PERFIL_DEFECTO = {
  nombre: "Principal",
  apellidos: "Good",
  usuario: "pancita",
  email: "principal@pancitawii.me",
  rol: "admin",
  plan: "premium",
  estado: "activo",
  activo: true,
  avatar: "/smile.avif",
  fechaNacimiento: "1995-07-21",
  pais: "Perú",
  genero: "Masculino",
  gustos: "Programar, música, café",
  bio: "Creador de Pancitawii.",
  tema: "futuro",
  creado: Date.now() - 30 * 24 * 3600 * 1000, // 30 días atrás
  ultActividad: Date.now()
};

export const cuentaDB = {
  /**
   * Obtiene el perfil del usuario desde localStorage.
   * Si no existe, guarda e inicializa el perfil por defecto.
   */
  obtenerCuenta() {
    let perfil = getls(CLAVE_STORAGE);
    if (!perfil) {
      perfil = { ...PERFIL_DEFECTO };
      this.guardarCuenta(perfil);
    }
    // Sincronizar última actividad en cada carga
    perfil.ultActividad = Date.now();
    return perfil;
  },

  /**
   * Guarda los cambios en el perfil.
   * @param {Object} datos Nuevos campos a actualizar
   */
  guardarCuenta(datos) {
    const perfilActual = getls(CLAVE_STORAGE) || { ...PERFIL_DEFECTO };
    const perfilActualizado = {
      ...perfilActual,
      ...datos,
      ultActividad: Date.now()
    };
    savels(CLAVE_STORAGE, perfilActualizado, HORAS_EXPIRACION);
    return perfilActualizado;
  },

  /**
   * Simula la actualización segura de la contraseña.
   * @param {string} nuevaPass Nueva contraseña a establecer
   */
  actualizarContrasena(nuevaPass) {
    return new Promise((resolve, reject) => {
      // Simulamos latencia de red para que se sienta real y premium
      setTimeout(() => {
        if (!nuevaPass || nuevaPass.length < 6) {
          reject(new Error("La contraseña debe tener al menos 6 caracteres"));
          return;
        }
        resolve({ success: true, message: "Contraseña actualizada correctamente localmente" });
      }, 800);
    });
  }
};

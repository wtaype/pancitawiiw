// src/features/horario/lib/horario_db.js
// Adaptador de Base de Datos desacoplado para el Horario Semanal
// Almacena en localStorage bajo la clave 'mihorario' (Listo para migrar a Firebase)

const KEY_HORARIO = 'mihorario';

// Rutina por defecto extraída de la imagen horario-lado-left.jpeg
const RUTINA_DEFECTO = [
  { id: '1', dia: 'Lunes', horaInicio: '04:30', horaFin: '05:00', titulo: 'Estudio 📘', tipo: 'fijo', color: 'var(--mco)' },
  { id: '2', dia: 'Lunes', horaInicio: '05:15', horaFin: '06:10', titulo: 'Desayuno & Preparación 🥞', tipo: 'flexible', color: 'var(--cielo)' },
  { id: '3', dia: 'Lunes', horaInicio: '06:15', horaFin: '07:00', titulo: 'Comer 🍽️', tipo: 'flexible', color: 'var(--paz)' },
  { id: '4', dia: 'Lunes', horaInicio: '07:01', horaFin: '07:14', titulo: 'Alistarse 🎒', tipo: 'flexible', color: 'var(--oro)' },
  { id: '5', dia: 'Lunes', horaInicio: '07:15', horaFin: '18:15', titulo: 'Trabajo 💼', tipo: 'fijo', color: 'var(--oro)' },
  { id: '6', dia: 'Lunes', horaInicio: '18:16', horaFin: '18:50', titulo: 'Cena 🍕', tipo: 'flexible', color: 'var(--cielo)' },
  { id: '7', dia: 'Lunes', horaInicio: '19:10', horaFin: '19:55', titulo: 'Tiempo Libre / Relax 🎬', tipo: 'flexible', color: 'var(--cielo)' },
  { id: '8', dia: 'Lunes', horaInicio: '20:10', horaFin: '04:25', titulo: 'Dormir 🌙', tipo: 'fijo', color: 'var(--mora)' },

  // Copia de rutina para días de semana (Martes a Viernes)
  { id: '9', dia: 'Martes', horaInicio: '04:30', horaFin: '05:00', titulo: 'Estudio 📘', tipo: 'fijo', color: 'var(--mco)' },
  { id: '10', dia: 'Martes', horaInicio: '07:15', horaFin: '18:15', titulo: 'Trabajo 💼', tipo: 'fijo', color: 'var(--oro)' },
  { id: '11', dia: 'Martes', horaInicio: '20:10', horaFin: '04:25', titulo: 'Dormir 🌙', tipo: 'fijo', color: 'var(--mora)' },

  { id: '12', dia: 'Miércoles', horaInicio: '04:30', horaFin: '05:00', titulo: 'Estudio 📘', tipo: 'fijo', color: 'var(--mco)' },
  { id: '13', dia: 'Miércoles', horaInicio: '07:15', horaFin: '18:15', titulo: 'Trabajo 💼', tipo: 'fijo', color: 'var(--oro)' },
  { id: '14', dia: 'Miércoles', horaInicio: '20:10', horaFin: '04:25', titulo: 'Dormir 🌙', tipo: 'fijo', color: 'var(--mora)' },

  { id: '15', dia: 'Jueves', horaInicio: '04:30', horaFin: '05:00', titulo: 'Estudio 📘', tipo: 'fijo', color: 'var(--mco)' },
  { id: '16', dia: 'Jueves', horaInicio: '07:15', horaFin: '18:15', titulo: 'Trabajo 💼', tipo: 'fijo', color: 'var(--oro)' },
  { id: '17', dia: 'Jueves', horaInicio: '20:10', horaFin: '04:25', titulo: 'Dormir 🌙', tipo: 'fijo', color: 'var(--mora)' },

  { id: '18', dia: 'Viernes', horaInicio: '04:30', horaFin: '05:00', titulo: 'Estudio 📘', tipo: 'fijo', color: 'var(--mco)' },
  { id: '19', dia: 'Viernes', horaInicio: '07:15', horaFin: '18:15', titulo: 'Trabajo 💼', tipo: 'fijo', color: 'var(--oro)' },
  { id: '20', dia: 'Viernes', horaInicio: '20:10', horaFin: '04:25', titulo: 'Dormir 🌙', tipo: 'fijo', color: 'var(--mora)' },

  // Sábado y Domingo
  { id: '21', dia: 'Sábado', horaInicio: '04:30', horaFin: '05:00', titulo: 'Estudio 📘', tipo: 'fijo', color: 'var(--mco)' },
  { id: '22', dia: 'Sábado', horaInicio: '07:15', horaFin: '14:00', titulo: 'Trabajo Medio Día 💼', tipo: 'fijo', color: 'var(--oro)' },
  { id: '23', dia: 'Sábado', horaInicio: '15:00', horaFin: '22:00', titulo: 'Tiempo Libre / Amigos 🚀', tipo: 'flexible', color: 'var(--cielo)' },

  { id: '24', dia: 'Domingo', horaInicio: '08:00', horaFin: '12:00', titulo: 'Paseo / Deporte 🚴', tipo: 'flexible', color: 'var(--paz)' },
  { id: '25', dia: 'Domingo', horaInicio: '18:16', horaFin: '18:50', titulo: 'Cena 🍕', tipo: 'flexible', color: 'var(--cielo)' },
  { id: '26', dia: 'Domingo', horaInicio: '20:10', horaFin: '04:25', titulo: 'Dormir 🌙', tipo: 'fijo', color: 'var(--mora)' }
];

export const horarioDB = {
  obtenerHorario() {
    try {
      const data = localStorage.getItem(KEY_HORARIO);
      if (!data) {
        this.guardarHorario(RUTINA_DEFECTO);
        return RUTINA_DEFECTO;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : RUTINA_DEFECTO;
    } catch {
      return RUTINA_DEFECTO;
    }
  },

  guardarHorario(lista) {
    try {
      localStorage.setItem(KEY_HORARIO, JSON.stringify(lista));
    } catch (e) {
      console.error('Error al guardar en localStorage mihorario:', e);
    }
  },

  agregarBloque(nuevoBloque) {
    const lista = this.obtenerHorario();
    const id = Date.now().toString();
    const bloqueConId = { ...nuevoBloque, id };
    lista.push(bloqueConId);
    this.guardarHorario(lista);
    return lista;
  },

  eliminarBloque(id) {
    const lista = this.obtenerHorario().filter(item => item.id !== id);
    this.guardarHorario(lista);
    return lista;
  },

  restaurarPorDefecto() {
    this.guardarHorario(RUTINA_DEFECTO);
    return RUTINA_DEFECTO;
  }
};

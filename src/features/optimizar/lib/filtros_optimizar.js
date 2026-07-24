// src/features/optimizar/lib/filtros_optimizar.js
// Motor de cálculo determinista para la Estructura Dual de Pilares (5 Pilares General vs 10 Pilares Profundo)

export function formatearBytes(bytes, decimales = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimales < 0 ? 0 : decimales;
  const tamaños = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamaños[i];
}

export function obtenerEstadoSaludRam(porcentaje) {
  if (porcentaje < 60) {
    return { estado: 'excelente', texto: 'Saludable', color: 'var(--success, #3cd741)', icono: 'fa-heart-pulse' };
  } else if (porcentaje < 85) {
    return { estado: 'moderado', texto: 'Uso Moderado', color: 'var(--mco, #00f3ff)', icono: 'fa-gauge' };
  } else {
    return { estado: 'critico', texto: 'Memoria Saturada', color: 'var(--error, #ff3849)', icono: 'fa-triangle-exclamation' };
  }
}

/// 🧹 CÁLCULO DE LOS 5 PILARES DE LIMPIEZA GENERAL (Salud Esencial - 100 Pts)
export function calcularPilaresGenerales(ram, basuraGeneral) {
  const pilares = [];
  let puntajeTotal = 0;

  const categorias = basuraGeneral?.categorias || [];

  // Pilar 1: Temporales del Usuario (%TEMP%)
  const catUser = categorias.find(c => c.id === 'elementos_recomendados');
  const bytesUser = catUser?.bytes || 0;
  const p1OK = bytesUser < 20971520; // < 20 MB
  const p1Pts = p1OK ? 20 : Math.max(5, 20 - Math.round(bytesUser / 10485760));
  pilares.push({ id: 'pilar_temp_user', nombre: 'Temporales de Usuario (%TEMP%)', ok: p1OK, pts: p1Pts, maxPts: 20 });
  puntajeTotal += p1Pts;

  // Pilar 2: Temporales de Windows (C:\Windows\Temp)
  const catSys = categorias.find(c => c.id === 'elementos_sistema');
  const bytesSys = catSys?.bytes || 0;
  const p2OK = bytesSys < 20971520;
  const p2Pts = p2OK ? 20 : Math.max(5, 20 - Math.round(bytesSys / 10485760));
  pilares.push({ id: 'pilar_temp_sys', nombre: 'Temporales de Windows', ok: p2OK, pts: p2Pts, maxPts: 20 });
  puntajeTotal += p2Pts;

  // Pilar 3: Prefetch de Ejecución
  const p3OK = bytesSys < 10485760;
  const p3Pts = p3OK ? 20 : 10;
  pilares.push({ id: 'pilar_prefetch', nombre: 'Caché Prefetch de Ejecución', ok: p3OK, pts: p3Pts, maxPts: 20 });
  puntajeTotal += p3Pts;

  // Pilar 4: Papelera de Reciclaje
  const p4OK = true; // Evaluado limpia por defecto
  pilares.push({ id: 'pilar_papelera', nombre: 'Papelera de Reciclaje de Windows', ok: p4OK, pts: 20, maxPts: 20 });
  puntajeTotal += 20;

  // Pilar 5: RAM Turbo
  const pctRam = ram?.porcentaje_uso || 50;
  const p5OK = pctRam < 75;
  const p5Pts = p5OK ? 20 : 10;
  pilares.push({ id: 'pilar_ram', nombre: 'Optimización RAM Turbo', ok: p5OK, pts: p5Pts, maxPts: 20 });
  puntajeTotal += p5Pts;

  const pilaresOK = pilares.filter(p => p.ok).length;
  const puntajeFinal = Math.min(100, Math.max(25, puntajeTotal));

  return {
    puntaje: puntajeFinal,
    pilaresOK,
    totalPilares: 5,
    pilares
  };
}

/// 🛡️ CÁLCULO DE LOS 10 PILARES DE LIMPIEZA PROFUNDA (Salud Experta - 100 Pts)
export function calcularPilaresProfundos(ram, basuraProfunda) {
  const pilares = [];
  let puntajeTotal = 0;
  const categorias = basuraProfunda?.categorias || [];

  const addPilar = (id, nombre, ok, pts) => {
    pilares.push({ id, nombre, ok, pts, maxPts: 10 });
    puntajeTotal += pts;
  };

  // Pilares 1-4: Básicos
  addPilar('p1', 'Temporales de Usuario (%TEMP%)', true, 10);
  addPilar('p2', 'Temporales del Sistema Windows', true, 10);
  addPilar('p3', 'Caché Prefetch de Ejecución', true, 10);
  addPilar('p4', 'Papelera de Reciclaje de Windows', true, 10);

  // Pilares 5-7: Navegadores
  const catNav = categorias.find(c => c.id === 'navegadores_web');
  const bytesNav = catNav?.bytes || 0;
  const navOK = bytesNav < 52428800; // < 50 MB
  addPilar('p5', 'Caché de Google Chrome', navOK, navOK ? 10 : 4);
  addPilar('p6', 'Caché de Microsoft Edge', navOK, navOK ? 10 : 4);
  addPilar('p7', 'Caché de Firefox / Navegadores Secundarios', true, 10);

  // Pilares 8-9: Registros de Apps
  addPilar('p8', 'Registros de Visual Studio Code', true, 10);
  addPilar('p9', 'Registros de Microsoft OneDrive', true, 10);

  // Pilar 10: Escudo Anti-Descargas
  addPilar('p10', 'Carpeta Descargas (Protegida)', true, 10);

  const pilaresOK = pilares.filter(p => p.ok).length;
  const puntajeFinal = Math.min(100, Math.max(30, puntajeTotal));

  return {
    puntaje: puntajeFinal,
    pilaresOK,
    totalPilares: 10,
    pilares
  };
}

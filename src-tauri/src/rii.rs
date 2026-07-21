// src-tauri/src/rii.rs
// CONFIGURACIÓN CENTRAL DEL BACKEND (Constantes Globales y Variables de Configuración)
// Edita este archivo para configurar dimensiones, rutas de archivos e IA en otros proyectos.

// --- CONFIGURACIÓN DE VENTANA ---
// Ancho inicial de la ventana de la aplicación por defecto (en píxeles)
pub const VENTANA_ANCHO: u32 = 1100;

// Alto inicial de la ventana de la aplicación por defecto (en píxeles)
pub const VENTANA_ALTO: u32 = 720;

// Ancho mínimo permitido para la redimensión de la ventana
pub const VENTANA_MIN_ANCHO: f64 = 320.0;

// Alto mínimo permitido para la redimensión de la ventana
pub const VENTANA_MIN_ALTO: f64 = 450.0;

// --- CONFIGURACIÓN DE VENTANA (SMILE WIDGET) ---
pub const SMILE_ANCHO: i32 = 75;
pub const SMILE_ALTO: i32 = 75;
// Título de la aplicación en la barra de tareas y el sistema operativo
pub const VENTANA_TITULO: &str = "pancitawii";

// Nombre del archivo ejecutable binario de salida (.exe)
pub const NOMBRE_APP_EXE: &str = "pancitawii.exe";


// --- RUTAS DE ARCHIVOS DEL SISTEMA ---
// Ruta al archivo local de registro de logs del backend
pub const RUTA_LOGS: &str = "../pancitawii.log";

// Ruta por defecto donde se guarda el archivo JSON de datos locales de pancitawii
pub const RUTA_DB_CIFRADA: &str = "../src/pancitawii_db.json";

// Ruta al archivo JavaScript de variables de entorno de la clave API de Gemini
pub const RUTA_ENV_JS: &str = "../src/env.js";


// --- PARÁMETROS DE INTELIGENCIA ARTIFICIAL (GEMINI) ---
// Modelos de Gemini a intentar en orden de prioridad (cascada de fallbacks)
pub const GEMINI_MODELOS: &[&str] = &[
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest"
];


// --- LÍMITES DE SEGURIDAD Y AUDITORÍA ---
// Cantidad de líneas que se leerán del log por defecto para mostrar en el frontend
pub const LOGS_RETENCION_LINEAS: usize = 30;

// Límite de tamaño máximo (1 MB) para la lectura de documentos clínicos
pub const DOCUMENTO_PESO_MAX_BYTES: u64 = 1024 * 1024;

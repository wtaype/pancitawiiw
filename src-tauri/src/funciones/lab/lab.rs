// src-tauri/src/funciones/lab/lab.rs
// Enrutador de comandos generales del sandbox del Laboratorio
use crate::nucleo::ridev;
use crate::nucleo::sistema;

#[tauri::command]
pub fn obtener_sistema_comando() -> Result<sistema::telemetria::MetricasSistema, String> {
    sistema::telemetria::obtener_metricas_sistema()
}

#[tauri::command]
pub fn ejecutar_limpieza_comando() -> Result<u64, String> {
    sistema::limpieza::ejecutar_limpieza_doctorwii()
}

#[tauri::command]
pub fn consola_ejecutar_comando(programa: String, args: Vec<String>) -> Result<String, String> {
    let args_slices: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    ridev::consola::ejecutar_comando(&programa, &args_slices)
}

#[tauri::command]
pub fn archivos_calcular_tamano_comando(ruta: String) -> Result<u64, String> {
    ridev::archivos::calcular_tamano_directorio(&ruta)
}

#[tauri::command]
pub fn sistema_listar_procesos_comando() -> Result<Vec<ridev::sistema::InfoProceso>, String> {
    ridev::sistema::listar_procesos()
}

#[tauri::command]
pub fn sistema_matar_proceso_comando(pid: u32) -> Result<String, String> {
    ridev::sistema::matar_proceso(pid)
}

#[tauri::command]
pub fn sistema_obtener_bateria_comando() -> Result<(u32, bool), String> {
    ridev::sistema::obtener_estado_bateria()
}

#[tauri::command]
pub async fn conectar_medir_latencia_comando(url: String) -> Result<u32, String> {
    ridev::conectar_ri::medir_latencia(&url).await
}

#[tauri::command]
pub fn base_datos_guardar_comando(ruta: String, clave: String, clave_datos: String, valor_datos: String) -> Result<String, String> {
    #[derive(serde::Serialize)]
    struct EntradaSimple {
        clave: String,
        valor: String,
    }
    let datos = EntradaSimple {
        clave: clave_datos,
        valor: valor_datos,
    };
    ridev::base_datos::guardar_json_cifrado(&ruta, &datos, &clave)?;
    Ok("Archivo JSON cifrado con éxito.".to_string())
}

#[tauri::command]
pub fn base_datos_cargar_comando(ruta: String, clave: String) -> Result<serde_json::Value, String> {
    ridev::base_datos::leer_json_descifrado::<serde_json::Value>(&ruta, &clave)
}

#[tauri::command]
pub fn notificaciones_lanzar_comando(titulo: String, mensaje: String) -> Result<String, String> {
    ridev::notificaciones::lanzar_notificacion(&titulo, &mensaje)
}

#[tauri::command]
pub fn logs_escribir_comando(nivel: String, mensaje: String) -> Result<String, String> {
    ridev::registro_logs::escribir_log(&nivel, &mensaje)?;
    Ok("Log registrado con éxito.".to_string())
}

#[tauri::command]
pub fn logs_leer_comando(limite: usize) -> Result<String, String> {
    let lim = if limite == 0 { crate::rii::LOGS_RETENCION_LINEAS } else { limite };
    ridev::registro_logs::leer_logs(lim)
}

#[tauri::command]
pub fn logs_borrar_comando() -> Result<String, String> {
    ridev::registro_logs::borrar_logs()?;
    Ok("Archivo doctorii.log eliminado correctamente.".to_string())
}

#[tauri::command]
pub fn documento_leer_archivo_comando(ruta: String) -> Result<String, String> {
    ridev::documento::leer_archivo_texto(&ruta)
}

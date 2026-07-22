// src-tauri/src/funciones/ajustes/actualizador.rs
// Módulo de actualización independiente para Pancitawii

use std::fs::File;
use std::io::Write;
use futures_util::StreamExt;
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    porcentaje: u32,
    descargado: u64,
    total: u64,
}

#[tauri::command]
pub fn actualizador_obtener_version_actual() -> Result<String, String> {
    // Devuelve la versión actual configurada en Cargo.toml
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub async fn actualizador_descargar_y_actualizar(
    app: tauri::AppHandle,
    url: String,
) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let zip_path = temp_dir.join("pancitawii_update.zip");

    // 1. Descarga del archivo ZIP de manera asíncrona
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "Pancitawii-App-Updater")
        .send()
        .await
        .map_err(|e| format!("Error en la petición de descarga: {}", e))?;

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut file = File::create(&zip_path)
        .map_err(|e| format!("No se pudo crear el archivo temporal ZIP: {}", e))?;
    
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Error al descargar chunk: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Error al escribir chunk en disco: {}", e))?;
        
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let porcentaje = ((downloaded as f64 / total_size as f64) * 100.0) as u32;
            // Emitir evento de progreso al frontend
            let _ = app.emit(
                "download-progress",
                ProgressPayload {
                    porcentaje,
                    descargado: downloaded,
                    total: total_size,
                },
            );
        }
    }

    // Asegurarse de cerrar el archivo ZIP antes de extraerlo
    drop(file);

    // 2. Obtener rutas para la actualización
    let current_exe = std::env::current_exe()
        .map_err(|e| format!("Error al obtener ejecutable actual: {}", e))?;
    let exe_path_str = current_exe.to_str().ok_or("Ruta de ejecutable inválida")?;
    
    let install_dir = current_exe
        .parent()
        .ok_or("No se pudo obtener el directorio de instalación")?;
    let install_dir_str = install_dir.to_str().ok_or("Ruta de instalación inválida")?;

    let zip_path_str = zip_path.to_str().ok_or("Ruta del ZIP temporal inválida")?;
    
    // 3. Crear el script temporal de PowerShell para actualizar
    let script_path = temp_dir.join("pancitawii_ejecutar_update.ps1");
    let script_path_str = script_path.to_str().ok_or("Ruta del script temporal inválida")?;

    let powershell_code = format!(
        r#"# Script de actualización Pancitawii
Start-Sleep -Seconds 1

# Asegurar cierre de Pancitawii
$proc = Get-Process -Name "pancitawii" -ErrorAction SilentlyContinue
if ($proc) {{
    Stop-Process -Name "pancitawii" -Force
    Start-Sleep -Seconds 1
}}

# Extraer el archivo ZIP sobreescribiendo los anteriores
Expand-Archive -Path "{}" -DestinationPath "{}" -Force

# Limpiar archivos temporales
Remove-Item -Path "{}" -Force
Remove-Item -Path $MyInvocation.MyCommand.Path -Force

# Relanzar la aplicación actualizada
Start-Process -FilePath "{}"
"#,
        zip_path_str, install_dir_str, zip_path_str, exe_path_str
    );

    let mut script_file = File::create(&script_path)
        .map_err(|e| format!("No se pudo crear el script de PowerShell: {}", e))?;
    script_file
        .write_all(powershell_code.as_bytes())
        .map_err(|e| format!("Error al escribir script de PowerShell: {}", e))?;
    drop(script_file);

    // 4. Lanzar PowerShell de manera 100% oculta en segundo plano
    #[cfg(target_os = "windows")]
    {{
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut cmd = std::process::Command::new("powershell");
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.args(&[
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            script_path_str,
        ]);
        cmd.spawn().map_err(|e| format!("No se pudo ejecutar el actualizador: {}", e))?;
    }}

    // Salir de la aplicación actual de inmediato
    std::process::exit(0);
}

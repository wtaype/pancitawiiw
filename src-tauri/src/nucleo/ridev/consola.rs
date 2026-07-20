// src-tauri/src/nucleo/ridev/consola.rs
// Helper para ejecución segura y oculta de comandos y scripts de Windows
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

pub fn ejecutar_comando(programa: &str, args: &[&str]) -> Result<String, String> {
    let mut cmd = Command::new(programa);
    cmd.args(args);
    
    // Bandera para evitar abrir una ventana de consola negra visible en Windows
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8(output.stdout)
                    .unwrap_or_else(|_| "Error al decodificar salida UTF-8".to_string());
                Ok(stdout.trim().to_string())
            } else {
                let stderr = String::from_utf8(output.stderr)
                    .unwrap_or_else(|_| "Error al decodificar salida de error UTF-8".to_string());
                Err(format!("Error (status {:?}): {}", output.status.code(), stderr.trim()))
            }
        }
        Err(e) => Err(format!("Fallo al iniciar el comando: {}", e)),
    }
}

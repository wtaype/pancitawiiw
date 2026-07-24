// src-tauri/src/funciones/optimizar/papelera.rs
// Módulo de operaciones Win32 API y decodificador nativo $I / $R para la Papelera de Reciclaje de Windows

use super::modelos::DetalleArchivoBasura;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

/// Consulta nativa Win32 del tamaño en bytes y número de elementos en la Papelera
pub fn obtener_tamano_papelera_win32() -> (u64, u64) {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::Shell::{SHQueryRecycleBinW, SHQUERYRBINFO};
        let mut info: SHQUERYRBINFO = unsafe { std::mem::zeroed() };
        info.cbSize = std::mem::size_of::<SHQUERYRBINFO>() as u32;
        let res = unsafe { SHQueryRecycleBinW(std::ptr::null(), &mut info) };
        if res == 0 {
            return (info.i64Size as u64, info.i64NumItems as u64);
        }
    }
    (0, 0)
}

/// Comando Tauri para vaciar silenciosamente la Papelera de Reciclaje nativa de Windows
#[tauri::command]
pub async fn optimizar_vaciar_papelera_nativa() -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(|| {
        #[cfg(target_os = "windows")]
        {
            use windows_sys::Win32::UI::Shell::{
                SHEmptyRecycleBinW, SHERB_NOCONFIRMATION, SHERB_NOPROGRESSUI, SHERB_NOSOUND,
            };

            let flags = SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND;
            let result = unsafe { SHEmptyRecycleBinW(std::ptr::null_mut(), std::ptr::null(), flags) };

            if result == 0 {
                Ok(true)
            } else {
                Ok(true)
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            Ok(true)
        }
    })
    .await
    .map_err(|e| format!("Error al vaciar la papelera: {}", e))?
}

/// Decodifica el archivo de metadatos $I de Windows (UTF-16LE) para obtener el nombre original y ruta de origen
fn decodificar_archivo_i_windows(path_i: &Path) -> Option<(String, String)> {
    let bytes = fs::read(path_i).ok()?;
    if bytes.len() < 24 {
        return None;
    }

    let version = u64::from_le_bytes(bytes[0..8].try_into().ok()?);
    let offset_path = if version == 2 {
        28 // Windows 10 / 11 format (Version 2)
    } else {
        16 // Windows Vista / 7 / 8 format (Version 1)
    };

    if bytes.len() <= offset_path {
        return None;
    }

    let path_bytes = &bytes[offset_path..];
    let u16_units: Vec<u16> = path_bytes
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .take_while(|&c| c != 0)
        .collect();

    let full_path = String::from_utf8(
        u16_units.iter().flat_map(|&c| {
            let mut buf = [0u8; 4];
            let s = std::char::from_u32(c as u32).unwrap_or('?').encode_utf8(&mut buf);
            s.bytes().collect::<Vec<u8>>()
        }).collect()
    ).ok()?;

    let p = PathBuf::from(&full_path);
    let nombre = p.file_name()?.to_string_lossy().to_string();
    Some((nombre, full_path))
}

/// Escanea físicamente C:\$Recycle.Bin y decodifica metadatos $I/$R ocultando residuos de 0 Bytes
pub fn escanear_archivos_fisicos_papelera() -> (u64, Vec<String>, Vec<DetalleArchivoBasura>) {
    let mut total_bytes = 0;
    let mut lista_rutas = Vec::new();
    let mut lista_archivos = Vec::new();

    let path_bin = PathBuf::from("C:\\$Recycle.Bin");
    if path_bin.exists() {
        if let Ok(entries) = fs::read_dir(&path_bin) {
            for entry in entries.flatten() {
                let sub_path = entry.path();
                if sub_path.is_dir() {
                    if let Ok(sub_entries) = fs::read_dir(&sub_path) {
                        for sub_entry in sub_entries.flatten() {
                            let file_path = sub_entry.path();
                            let nombre_archivo = file_path.file_name().unwrap_or_default().to_string_lossy().to_string();

                            // Filtrar archivos de metadatos tipo $I... y archivos de sistema desktop.ini
                            if nombre_archivo.starts_with("$I") || nombre_archivo.eq_ignore_ascii_case("desktop.ini") {
                                continue;
                            }

                            if let Ok(meta) = sub_entry.metadata() {
                                let len = meta.len();
                                // Filtrar residuos vacíos de 0 Bytes
                                if len == 0 {
                                    continue;
                                }

                                total_bytes += len;
                                let ruta_str = file_path.to_string_lossy().to_string();

                                // Intentar buscar el archivo $I hermano para obtener el nombre original de Windows
                                let mut nombre_real = nombre_archivo.clone();
                                let mut ruta_origen = ruta_str.clone();

                                if nombre_archivo.starts_with("$R") {
                                    let id_parte = &nombre_archivo[2..];
                                    let path_i_hermano = sub_path.join(format!("$I{}", id_parte));
                                    if path_i_hermano.exists() {
                                        if let Some((n_orig, r_orig)) = decodificar_archivo_i_windows(&path_i_hermano) {
                                            nombre_real = n_orig;
                                            ruta_origen = r_orig;
                                        }
                                    }
                                }

                                let fecha_mod = meta.modified()
                                    .ok()
                                    .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                                    .map(|d| d.as_secs())
                                    .unwrap_or(0);

                                lista_rutas.push(ruta_str);

                                if lista_archivos.len() < 100 {
                                    lista_archivos.push(DetalleArchivoBasura {
                                        nombre: nombre_real,
                                        ruta: ruta_origen,
                                        tamano_bytes: len,
                                        fecha_modificacion: fecha_mod,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    (total_bytes, lista_rutas, lista_archivos)
}

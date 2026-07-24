// src-tauri/src/funciones/optimizar/analisis_profundo.rs
// Módulo de análisis exclusivo de los 10 Pilares de Limpieza Profunda con Papelera como Pilar 1

use super::limpiador::calcular_tamano_dir_detallado;
use super::modelos::{CategoriaBasura, ItemAppBasura, ResultadoEscaneoBasura};
use super::papelera::{escanear_archivos_fisicos_papelera, obtener_tamano_papelera_win32};
use std::path::PathBuf;

/// Escanea los 10 Pilares de Limpieza Profunda (Papelera como Pilar 1)
#[tauri::command]
pub async fn optimizar_escanear_basura_profundo() -> Result<ResultadoEscaneoBasura, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut categorias = Vec::new();

        // 1. Pilar 1: Papelera de Reciclaje de Windows
        let (bytes_win32, items_win32) = obtener_tamano_papelera_win32();
        let (bytes_fisicos, rts_pape, archs_pape) = escanear_archivos_fisicos_papelera();

        let bytes_papelera = if bytes_win32 > 0 { bytes_win32 } else { bytes_fisicos };
        let num_items = if items_win32 > 0 { items_win32 } else { archs_pape.len() as u64 };

        let desc_papelera = if num_items > 0 {
            format!("{} archivo(s) en Papelera de Reciclaje", num_items)
        } else {
            "Papelera de reciclaje vacía".to_string()
        };

        let sub_pape = if num_items > 0 {
            vec![ItemAppBasura {
                id: "recycle_bin_items".into(),
                nombre: format!("Papelera de Reciclaje ({} elementos)", num_items),
                icono: "fa-trash-can".into(),
                bytes: bytes_papelera,
                protegida: false,
                archivos: archs_pape,
                rutas: rts_pape,
            }]
        } else {
            vec![]
        };

        categorias.push(CategoriaBasura {
            id: "pilar_papelera".into(),
            titulo: "Pilar 1: Papelera de Reciclaje de Windows".into(),
            descripcion: desc_papelera,
            bytes: bytes_papelera,
            protegida: false,
            subitems: sub_pape,
            rutas: vec![],
        });

        // 2. Pilar 2: Temporales del Usuario (%TEMP%)
        if let Ok(temp_user) = std::env::var("TEMP") {
            let p = PathBuf::from(&temp_user);
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&p);
            categorias.push(CategoriaBasura {
                id: "pilar_prof_2".into(),
                titulo: "Pilar 2: Archivos Temporales de Usuario".into(),
                descripcion: "Caché de usuario en %TEMP%".into(),
                bytes,
                protegida: false,
                subitems: vec![ItemAppBasura { id: "p2".into(), nombre: "Archivos en %TEMP%".into(), icono: "fa-folder-open".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                rutas: rts,
            });
        }

        // 3. Pilar 3: Temporales del Sistema Windows
        let win_temp = PathBuf::from("C:\\Windows\\Temp");
        if win_temp.exists() {
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&win_temp);
            categorias.push(CategoriaBasura {
                id: "pilar_prof_3".into(),
                titulo: "Pilar 3: Temporales del Sistema Windows".into(),
                descripcion: "Temporales del SO (C:\\Windows\\Temp)".into(),
                bytes,
                protegida: false,
                subitems: vec![ItemAppBasura { id: "p3".into(), nombre: "Archivos de sistema".into(), icono: "fa-gears".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                rutas: rts,
            });
        }

        // 4. Pilar 4: Prefetch
        let prefetch = PathBuf::from("C:\\Windows\\Prefetch");
        if prefetch.exists() {
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&prefetch);
            categorias.push(CategoriaBasura {
                id: "pilar_prof_4".into(),
                titulo: "Pilar 4: Caché Prefetch de Ejecución".into(),
                descripcion: "Precarga de ejecutables Windows".into(),
                bytes,
                protegida: false,
                subitems: vec![ItemAppBasura { id: "p4".into(), nombre: "Archivos .pf".into(), icono: "fa-bolt".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                rutas: rts,
            });
        }

        // 5. Pilar 5: Chrome
        if let Ok(appdata) = std::env::var("LOCALAPPDATA") {
            let chrome = PathBuf::from(&appdata).join("Google\\Chrome\\User Data\\Default\\Cache");
            if chrome.exists() {
                let (bytes, rts, archs) = calcular_tamano_dir_detallado(&chrome);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_5".into(),
                    titulo: "Pilar 5: Caché de Google Chrome".into(),
                    descripcion: "Imágenes y datos temporales de navegación en Chrome".into(),
                    bytes,
                    protegida: false,
                    subitems: vec![ItemAppBasura { id: "p5".into(), nombre: "Archivos de caché Chrome".into(), icono: "fa-chrome".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                    rutas: rts,
                });
            }

            // 6. Pilar 6: Edge
            let edge = PathBuf::from(&appdata).join("Microsoft\\Edge\\User Data\\Default\\Cache");
            if edge.exists() {
                let (bytes, rts, archs) = calcular_tamano_dir_detallado(&edge);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_6".into(),
                    titulo: "Pilar 6: Caché de Microsoft Edge".into(),
                    descripcion: "Imágenes y datos temporales de navegación en Edge".into(),
                    bytes,
                    protegida: false,
                    subitems: vec![ItemAppBasura { id: "p6".into(), nombre: "Archivos de caché Edge".into(), icono: "fa-edge".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                    rutas: rts,
                });
            }
        }

        // 7. Pilar 7: Firefox
        if let Ok(appdata) = std::env::var("LOCALAPPDATA") {
            let firefox = PathBuf::from(&appdata).join("Mozilla\\Firefox\\Profiles");
            if firefox.exists() {
                let (bytes, rts, archs) = calcular_tamano_dir_detallado(&firefox);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_7".into(),
                    titulo: "Pilar 7: Caché de Mozilla Firefox".into(),
                    descripcion: "Archivos temporales del perfil de Firefox".into(),
                    bytes,
                    protegida: false,
                    subitems: vec![ItemAppBasura { id: "p7".into(), nombre: "Caché de Firefox".into(), icono: "fa-firefox-browser".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                    rutas: rts,
                });
            }
        }

        // 8. Pilar 8: VSCode
        if let Ok(appdata) = std::env::var("APPDATA") {
            let vsc = PathBuf::from(&appdata).join("Code\\CachedData");
            if vsc.exists() {
                let (bytes, rts, archs) = calcular_tamano_dir_detallado(&vsc);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_8".into(),
                    titulo: "Pilar 8: Registros de Visual Studio Code".into(),
                    descripcion: "Caché de extensiones e historial de VSCode".into(),
                    bytes,
                    protegida: false,
                    subitems: vec![ItemAppBasura { id: "p8".into(), nombre: "Archivos de datos VSCode".into(), icono: "fa-code".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                    rutas: rts,
                });
            }
        }

        // 9. Pilar 9: OneDrive
        if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
            let od = PathBuf::from(&localappdata).join("Microsoft\\OneDrive\\logs");
            if od.exists() {
                let (b, r, a) = calcular_tamano_dir_detallado(&od);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_9".into(),
                    titulo: "Pilar 9: Registros de Microsoft OneDrive".into(),
                    descripcion: "Logs de sincronización en la nube".into(),
                    bytes: b,
                    protegida: false,
                    subitems: vec![ItemAppBasura { id: "p9".into(), nombre: "Logs de OneDrive".into(), icono: "fa-cloud".into(), bytes: b, protegida: false, archivos: a, rutas: r.clone() }],
                    rutas: r,
                });
            }
        }

        // 10. Pilar 10: Carpeta Descargas (Protegido)
        if let Ok(userprofile) = std::env::var("USERPROFILE") {
            let downloads = PathBuf::from(&userprofile).join("Downloads");
            if downloads.exists() {
                let (bytes, rts, archs) = calcular_tamano_dir_detallado(&downloads);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_10".into(),
                    titulo: "Pilar 10: Carpeta de Descargas (Protegido)".into(),
                    descripcion: "Archivos descargados por el usuario. Desmarcado por seguridad.".into(),
                    bytes,
                    protegida: true,
                    subitems: vec![ItemAppBasura { id: "p10".into(), nombre: "Archivos descargados".into(), icono: "fa-download".into(), bytes, protegida: true, archivos: archs, rutas: rts.clone() }],
                    rutas: rts,
                });
            }
        }

        let total_bytes = categorias.iter().map(|c| c.bytes).sum();
        Ok(ResultadoEscaneoBasura {
            categorias,
            total_bytes,
        })
    })
    .await
    .map_err(|e| format!("Error escaneando 10 pilares profundos: {}", e))?
}

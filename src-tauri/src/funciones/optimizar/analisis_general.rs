// src-tauri/src/funciones/optimizar/analisis_general.rs
// Módulo de análisis exclusivo de los 5 Pilares de Limpieza General con Papelera como Pilar 1

use super::limpiador::calcular_tamano_dir_detallado;
use super::modelos::{CategoriaBasura, ItemAppBasura, ResultadoEscaneoBasura};
use super::papelera::{escanear_archivos_fisicos_papelera, obtener_tamano_papelera_win32};
use std::path::PathBuf;

/// Escanea los 5 Pilares de Limpieza General (Papelera como Pilar 1)
#[tauri::command]
pub async fn optimizar_escanear_basura_general() -> Result<ResultadoEscaneoBasura, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut categorias = Vec::new();

        // 1. Pilar 1: Papelera de Reciclaje de Windows (Medición Win32 + Escáner Físico $Recycle.Bin)
        let (bytes_win32, items_win32) = obtener_tamano_papelera_win32();
        let (bytes_fisicos, rts_pape, archs_pape) = escanear_archivos_fisicos_papelera();

        let bytes_papelera = if bytes_win32 > 0 { bytes_win32 } else { bytes_fisicos };
        let num_items = if items_win32 > 0 { items_win32 } else { archs_pape.len() as u64 };

        let desc_papelera = if num_items > 0 {
            format!("{} archivo(s) pendientes de eliminación permanente en la Papelera", num_items)
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
            let sub_user = vec![ItemAppBasura {
                id: "temp_user_files".into(),
                nombre: "Archivos temporales en %TEMP%".into(),
                icono: "fa-folder-open".into(),
                bytes,
                protegida: false,
                archivos: archs,
                rutas: rts.clone(),
            }];
            categorias.push(CategoriaBasura {
                id: "pilar_temp_user".into(),
                titulo: "Pilar 2: Archivos Temporales de Usuario (%TEMP%)".into(),
                descripcion: "Caché y temporales acumulados por aplicaciones en tu perfil".into(),
                bytes,
                protegida: false,
                subitems: sub_user,
                rutas: rts,
            });
        }

        // 3. Pilar 3: Temporales del Sistema (C:\Windows\Temp)
        let win_temp = PathBuf::from("C:\\Windows\\Temp");
        if win_temp.exists() {
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&win_temp);
            let sub_sys = vec![ItemAppBasura {
                id: "win_temp_files".into(),
                nombre: "Archivos de sistema en C:\\Windows\\Temp".into(),
                icono: "fa-gears".into(),
                bytes,
                protegida: false,
                archivos: archs,
                rutas: rts.clone(),
            }];
            categorias.push(CategoriaBasura {
                id: "pilar_temp_sys".into(),
                titulo: "Pilar 3: Temporales del Sistema Windows".into(),
                descripcion: "Archivos temporales del núcleo de Windows (C:\\Windows\\Temp)".into(),
                bytes,
                protegida: false,
                subitems: sub_sys,
                rutas: rts,
            });
        }

        // 4. Pilar 4: Caché Prefetch de Ejecución
        let prefetch = PathBuf::from("C:\\Windows\\Prefetch");
        if prefetch.exists() {
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&prefetch);
            let sub_pf = vec![ItemAppBasura {
                id: "prefetch_files".into(),
                nombre: "Caché de precarga de ejecutables (.pf)".into(),
                icono: "fa-bolt".into(),
                bytes,
                protegida: false,
                archivos: archs,
                rutas: rts.clone(),
            }];
            categorias.push(CategoriaBasura {
                id: "pilar_prefetch".into(),
                titulo: "Pilar 4: Caché Prefetch de Ejecución".into(),
                descripcion: "Caché de precarga de aplicaciones en C:\\Windows\\Prefetch".into(),
                bytes,
                protegida: false,
                subitems: sub_pf,
                rutas: rts,
            });
        }

        // 5. Pilar 5: Registros de VSCode y OneDrive
        let mut sub_apps = Vec::new();
        let mut rts_apps = Vec::new();
        let mut bytes_apps = 0;

        if let Ok(appdata) = std::env::var("APPDATA") {
            let vsc = PathBuf::from(&appdata).join("Code\\CachedData");
            if vsc.exists() {
                let (b, r, a) = calcular_tamano_dir_detallado(&vsc);
                bytes_apps += b;
                rts_apps.extend(r.clone());
                sub_apps.push(ItemAppBasura {
                    id: "vsc_files".into(),
                    nombre: "Caché de Visual Studio Code".into(),
                    icono: "fa-code".into(),
                    bytes: b,
                    protegida: false,
                    archivos: a,
                    rutas: r,
                });
            }
        }

        if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
            let od = PathBuf::from(&localappdata).join("Microsoft\\OneDrive\\logs");
            if od.exists() {
                let (b, r, a) = calcular_tamano_dir_detallado(&od);
                bytes_apps += b;
                rts_apps.extend(r.clone());
                sub_apps.push(ItemAppBasura {
                    id: "onedrive_files".into(),
                    nombre: "Registros de Microsoft OneDrive".into(),
                    icono: "fa-cloud".into(),
                    bytes: b,
                    protegida: false,
                    archivos: a,
                    rutas: r,
                });
            }
        }

        categorias.push(CategoriaBasura {
            id: "pilar_apps_logs".into(),
            titulo: "Pilar 5: Registros y Caché de Aplicaciones".into(),
            descripcion: "Archivos temporales de aplicaciones activas (VSCode, OneDrive)".into(),
            bytes: bytes_apps,
            protegida: false,
            subitems: sub_apps,
            rutas: rts_apps,
        });

        let total_bytes = categorias.iter().map(|c| c.bytes).sum();
        Ok(ResultadoEscaneoBasura {
            categorias,
            total_bytes,
        })
    })
    .await
    .map_err(|e| format!("Error escaneando 5 pilares generales: {}", e))?
}

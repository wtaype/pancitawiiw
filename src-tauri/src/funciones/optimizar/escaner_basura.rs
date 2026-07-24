// src-tauri/src/funciones/optimizar/escaner_basura.rs
// Escáner multihilo en Rust con los 5 Pilares de Limpieza General y 10 Pilares de Limpieza Profunda como tarjetas principales (Estilo Microsoft PC Manager)

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use rayon::prelude::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DetalleArchivoBasura {
    pub nombre: String,
    pub ruta: String,
    pub tamano_bytes: u64,
    pub fecha_modificacion: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemAppBasura {
    pub id: String,
    pub nombre: String,
    pub icono: String,
    pub bytes: u64,
    pub protegida: bool,
    pub archivos: Vec<DetalleArchivoBasura>,
    pub rutas: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoriaBasura {
    pub id: String,
    pub titulo: String,
    pub descripcion: String,
    pub bytes: u64,
    pub protegida: bool,
    pub subitems: Vec<ItemAppBasura>,
    pub rutas: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultadoEscaneoBasura {
    pub categorias: Vec<CategoriaBasura>,
    pub total_bytes: u64,
}

/// Escanea los 5 Pilares de Limpieza General (Top-level cards)
#[tauri::command]
pub async fn optimizar_escanear_basura_general() -> Result<ResultadoEscaneoBasura, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut categorias = Vec::new();

        // 1. Pilar 1: Temporales del Usuario (%TEMP%)
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
                titulo: "Pilar 1: Archivos Temporales de Usuario (%TEMP%)".into(),
                descripcion: "Caché y temporales acumulados por aplicaciones en tu perfil".into(),
                bytes,
                protegida: false,
                subitems: sub_user,
                rutas: rts,
            });
        }

        // 2. Pilar 2: Temporales del Sistema (C:\Windows\Temp)
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
                titulo: "Pilar 2: Temporales del Sistema Windows".into(),
                descripcion: "Archivos temporales del núcleo de Windows (C:\\Windows\\Temp)".into(),
                bytes,
                protegida: false,
                subitems: sub_sys,
                rutas: rts,
            });
        }

        // 3. Pilar 3: Caché Prefetch de Ejecución
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
                titulo: "Pilar 3: Caché Prefetch de Ejecución".into(),
                descripcion: "Caché de precarga de aplicaciones en C:\\Windows\\Prefetch".into(),
                bytes,
                protegida: false,
                subitems: sub_pf,
                rutas: rts,
            });
        }

        // 4. Pilar 4: Registros de VSCode y OneDrive
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
            titulo: "Pilar 4: Registros y Caché de Aplicaciones".into(),
            descripcion: "Archivos temporales de aplicaciones activas (VSCode, OneDrive)".into(),
            bytes: bytes_apps,
            protegida: false,
            subitems: sub_apps,
            rutas: rts_apps,
        });

        // 5. Pilar 5: Papelera de Reciclaje
        categorias.push(CategoriaBasura {
            id: "pilar_papelera".into(),
            titulo: "Pilar 5: Papelera de Reciclaje de Windows".into(),
            descripcion: "Archivos reciclados pendientes de eliminación permanente".into(),
            bytes: 0,
            protegida: false,
            subitems: vec![],
            rutas: vec![],
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

/// Escanea los 10 Pilares de Limpieza Profunda (Top-level cards)
#[tauri::command]
pub async fn optimizar_escanear_basura_profundo() -> Result<ResultadoEscaneoBasura, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut categorias = Vec::new();

        // Pilares 1, 2, 3, 4 (Basura base)
        if let Ok(temp_user) = std::env::var("TEMP") {
            let p = PathBuf::from(&temp_user);
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&p);
            categorias.push(CategoriaBasura {
                id: "pilar_prof_1".into(),
                titulo: "Pilar 1: Archivos Temporales de Usuario".into(),
                descripcion: "Caché de usuario en %TEMP%".into(),
                bytes,
                protegida: false,
                subitems: vec![ItemAppBasura { id: "p1".into(), nombre: "Archivos en %TEMP%".into(), icono: "fa-folder-open".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                rutas: rts,
            });
        }

        let win_temp = PathBuf::from("C:\\Windows\\Temp");
        if win_temp.exists() {
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&win_temp);
            categorias.push(CategoriaBasura {
                id: "pilar_prof_2".into(),
                titulo: "Pilar 2: Temporales del Sistema Windows".into(),
                descripcion: "Temporales del SO (C:\\Windows\\Temp)".into(),
                bytes,
                protegida: false,
                subitems: vec![ItemAppBasura { id: "p2".into(), nombre: "Archivos de sistema".into(), icono: "fa-gears".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                rutas: rts,
            });
        }

        let prefetch = PathBuf::from("C:\\Windows\\Prefetch");
        if prefetch.exists() {
            let (bytes, rts, archs) = calcular_tamano_dir_detallado(&prefetch);
            categorias.push(CategoriaBasura {
                id: "pilar_prof_3".into(),
                titulo: "Pilar 3: Caché Prefetch de Ejecución".into(),
                descripcion: "Precarga de ejecutables Windows".into(),
                bytes,
                protegida: false,
                subitems: vec![ItemAppBasura { id: "p3".into(), nombre: "Archivos .pf".into(), icono: "fa-bolt".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                rutas: rts,
            });
        }

        categorias.push(CategoriaBasura {
            id: "pilar_prof_4".into(),
            titulo: "Pilar 4: Papelera de Reciclaje de Windows".into(),
            descripcion: "Vaciado de elementos eliminados".into(),
            bytes: 0,
            protegida: false,
            subitems: vec![],
            rutas: vec![],
        });

        // Pilar 5: Caché de Google Chrome
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

            // Pilar 6: Caché de Microsoft Edge
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

        // Pilar 7: Caché de Firefox
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

        // Pilar 8: VSCode
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

        // Pilar 9: OneDrive
        if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
            let od = PathBuf::from(&localappdata).join("Microsoft\\OneDrive\\logs");
            if od.exists() {
                let (bytes, rts, archs) = calcular_tamano_dir_detallado(&od);
                categorias.push(CategoriaBasura {
                    id: "pilar_prof_9".into(),
                    titulo: "Pilar 9: Registros de Microsoft OneDrive".into(),
                    descripcion: "Logs de sincronización en la nube".into(),
                    bytes,
                    protegida: false,
                    subitems: vec![ItemAppBasura { id: "p9".into(), nombre: "Logs de OneDrive".into(), icono: "fa-cloud".into(), bytes, protegida: false, archivos: archs, rutas: rts.clone() }],
                    rutas: rts,
                });
            }
        }

        // Pilar 10: Carpeta Descargas (Protegido)
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

/// Elimina en paralelo las rutas de archivos recibidas
#[tauri::command]
pub async fn optimizar_ejecutar_limpieza(rutas: Vec<String>) -> Result<u64, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let bytes_liberados: u64 = rutas.par_iter().map(|ruta_str| {
            let p = Path::new(ruta_str);
            if let Ok(meta) = fs::metadata(p) {
                let len = meta.len();
                if p.is_file() {
                    let _ = fs::remove_file(p);
                    len
                } else if p.is_dir() {
                    let _ = fs::remove_dir_all(p);
                    len
                } else {
                    0
                }
            } else {
                0
            }
        }).sum();

        Ok(bytes_liberados)
    })
    .await
    .map_err(|e| format!("Error al ejecutar la limpieza: {}", e))?
}

fn calcular_tamano_dir_detallado(dir: &Path) -> (u64, Vec<String>, Vec<DetalleArchivoBasura>) {
    let mut total_bytes = 0;
    let mut lista_rutas = Vec::new();
    let mut lista_archivos = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    let len = meta.len();
                    total_bytes += len;
                    let ruta_str = path.to_string_lossy().to_string();
                    let nombre_str = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                    
                    let fecha_mod = meta.modified()
                        .ok()
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    lista_rutas.push(ruta_str.clone());
                    
                    if lista_archivos.len() < 100 {
                        lista_archivos.push(DetalleArchivoBasura {
                            nombre: nombre_str,
                            ruta: ruta_str,
                            tamano_bytes: len,
                            fecha_modificacion: fecha_mod,
                        });
                    }
                } else if meta.is_dir() {
                    let (sub_bytes, sub_rutas, sub_archs) = calcular_tamano_dir_detallado(&path);
                    total_bytes += sub_bytes;
                    lista_rutas.extend(sub_rutas);
                    if lista_archivos.len() < 100 {
                        lista_archivos.extend(sub_archs.into_iter().take(100 - lista_archivos.len()));
                    }
                }
            }
        }
    }

    (total_bytes, lista_rutas, lista_archivos)
}

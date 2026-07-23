// src-tauri/src/funciones/duplicados/escaner_3etapas.rs
// Motor de búsqueda de archivos duplicados ultra-rápido en 3 Etapas con Rayon y Blake3 / xxHash

use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, BufReader};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use serde::{Serialize, Deserialize};
use rayon::prelude::*;
use xxhash_rust::xxh3::xxh3_64;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchivoInfo {
    pub ruta: String,
    pub nombre: String,
    pub tamano_bytes: u64,
    pub extension: String,
    pub fecha_modificacion: u64,
    pub hash_completo: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrupoDuplicados {
    pub hash: String,
    pub tamano_bytes: u64,
    pub total_archivos: usize,
    pub bytes_desperdiciados: u64,
    pub archivos: Vec<ArchivoInfo>,
}

/// Comando principal de Tauri para iniciar el escaneo de 3 etapas
#[tauri::command]
pub async fn duplicados_iniciar_escaner(
    rutas: Vec<String>,
    tamano_minimo_bytes: Option<u64>,
    extensiones_permitidas: Option<Vec<String>>,
) -> Result<Vec<GrupoDuplicados>, String> {
    let min_bytes = tamano_minimo_bytes.unwrap_or(1024); // 1 KB por defecto para omitir archivos vacíos o insignificantes
    let exts: Option<Vec<String>> = extensiones_permitidas.map(|list| {
        list.into_iter().map(|e| e.to_lowercase().trim_start_matches('.').to_string()).collect()
    });

    tauri::async_runtime::spawn_blocking(move || {
        ejecutar_pipeline_3etapas(rutas, min_bytes, exts)
    })
    .await
    .map_err(|e| format!("Error en la ejecución del hilo de escaneo: {}", e))?
}

fn ejecutar_pipeline_3etapas(
    rutas: Vec<String>,
    min_bytes: u64,
    extensiones: Option<Vec<String>>,
) -> Result<Vec<GrupoDuplicados>, String> {
    // ========================================================================
    // ETAPA 1: Travesía de directorios y agrupación por TAMAÑO EXACTO
    // ========================================================================
    let mut mapa_tamano: HashMap<u64, Vec<PathBuf>> = HashMap::new();

    for ruta_str in &rutas {
        let root_path = Path::new(ruta_str);
        if !root_path.exists() {
            continue;
        }
        recorrer_directorio(root_path, min_bytes, &extensiones, &mut mapa_tamano);
    }

    // Filtrar: Conservar solo tamaños que contengan 2 o más archivos (candidatos potenciales)
    let candidatos_etapa1: Vec<(u64, Vec<PathBuf>)> = mapa_tamano
        .into_iter()
        .filter(|(_, archivos)| archivos.len() >= 2)
        .collect();

    if candidatos_etapa1.is_empty() {
        return Ok(Vec::new());
    }

    // ========================================================================
    // ETAPA 2: Hash Parcial de Cabecera (Primeros 64 KB con xxHash3)
    // ========================================================================
    // Aplanar los candidatos para procesamiento paralelo con Rayon
    let mut lista_para_partial_hash: Vec<(u64, PathBuf)> = Vec::new();
    for (tamano, archivos) in candidatos_etapa1 {
        for path in archivos {
            lista_para_partial_hash.push((tamano, path));
        }
    }

    let resultados_partial: Vec<Option<(u64, u64, PathBuf)>> = lista_para_partial_hash
        .into_par_iter()
        .map(|(tamano, path)| {
            match calcular_partial_hash(&path) {
                Ok(hash_partial) => Some((tamano, hash_partial, path)),
                Err(_) => None,
            }
        })
        .collect();

    let mut mapa_partial: HashMap<(u64, u64), Vec<PathBuf>> = HashMap::new();
    for res in resultados_partial.into_iter().flatten() {
        let (tamano, hash_partial, path) = res;
        mapa_partial.entry((tamano, hash_partial)).or_default().push(path);
    }

    // Filtrar candidatos de Etapa 2 con 2 o más archivos
    let candidatos_etapa2: Vec<Vec<PathBuf>> = mapa_partial
        .into_iter()
        .filter(|(_, archivos)| archivos.len() >= 2)
        .map(|(_, archivos)| archivos)
        .collect();

    if candidatos_etapa2.is_empty() {
        return Ok(Vec::new());
    }

    // ========================================================================
    // ETAPA 3: Hash Completo Blake3 en Paralelo sobre candidatos finales
    // ========================================================================
    let mut lista_para_full_hash: Vec<PathBuf> = Vec::new();
    for grupo in candidatos_etapa2 {
        for path in grupo {
            lista_para_full_hash.push(path);
        }
    }

    let resultados_full: Vec<Option<ArchivoInfo>> = lista_para_full_hash
        .into_par_iter()
        .map(|path| {
            match crear_archivo_info(&path) {
                Ok(info) => Some(info),
                Err(_) => None,
            }
        })
        .collect();

    // Agrupar por Hash Completo Blake3
    let mut mapa_duplicados_final: HashMap<String, Vec<ArchivoInfo>> = HashMap::new();
    for info in resultados_full.into_iter().flatten() {
        mapa_duplicados_final.entry(info.hash_completo.clone()).or_default().push(info);
    }

    // Estructurar resultado final de los grupos de duplicados confirmados
    let mut resultado_grupos: Vec<GrupoDuplicados> = Vec::new();

    for (hash, archivos) in mapa_duplicados_final {
        if archivos.len() >= 2 {
            let tamano_bytes = archivos[0].tamano_bytes;
            let total_archivos = archivos.len();
            // Espacio desperdiciado: (archivos - 1) * peso
            let bytes_desperdiciados = (total_archivos as u64 - 1) * tamano_bytes;

            resultado_grupos.push(GrupoDuplicados {
                hash,
                tamano_bytes,
                total_archivos,
                bytes_desperdiciados,
                archivos,
            });
        }
    }

    // Ordenar grupos por mayor espacio desperdiciado primero
    resultado_grupos.sort_by(|a, b| b.bytes_desperdiciados.cmp(&a.bytes_desperdiciados));

    Ok(resultado_grupos)
}

/// Recorre un directorio recursivamente acumulando archivos por tamaño exacto
fn recorrer_directorio(
    dir: &Path,
    min_bytes: u64,
    extensiones: &Option<Vec<String>>,
    mapa_tamano: &mut HashMap<u64, Vec<PathBuf>>,
) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Evitar carpetas de sistema o de bloqueo especial
                let nombre_dir = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if nombre_dir.starts_with('$') || nombre_dir == "System Volume Information" {
                    continue;
                }
                recorrer_directorio(&path, min_bytes, extensiones, mapa_tamano);
            } else if path.is_file() {
                if let Ok(meta) = path.metadata() {
                    let len = meta.len();
                    if len >= min_bytes {
                        if let Some(exts) = extensiones {
                            let ext_archivo = path
                                .extension()
                                .and_then(|e| e.to_str())
                                .unwrap_or("")
                                .to_lowercase();
                            if !exts.contains(&ext_archivo) {
                                continue;
                            }
                        }
                        mapa_tamano.entry(len).or_default().push(path);
                    }
                }
            }
        }
    }
}

/// Lee únicamente los primeros 64 KB de un archivo y retorna el Hash xxHash3
fn calcular_partial_hash(path: &Path) -> Result<u64, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let mut reader = BufReader::new(file);
    let mut buffer = [0u8; 64 * 1024];
    let n = reader.read(&mut buffer).map_err(|e| e.to_string())?;
    Ok(xxh3_64(&buffer[..n]))
}

/// Lee todo el archivo streaming y genera un hash BLAKE3 junto a la metadata
fn crear_archivo_info(path: &Path) -> Result<ArchivoInfo, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let meta = file.metadata().map_err(|e| e.to_string())?;
    let tamano_bytes = meta.len();

    let fecha_modificacion = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let mut reader = BufReader::new(file);
    let mut hasher = blake3::Hasher::new();
    let mut buffer = [0u8; 64 * 1024];

    loop {
        let n = reader.read(&mut buffer).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }

    let hash_completo = hasher.finalize().to_hex().to_string();

    let nombre = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("desconocido")
        .to_string();

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    Ok(ArchivoInfo {
        ruta: path.to_string_lossy().to_string(),
        nombre,
        tamano_bytes,
        extension,
        fecha_modificacion,
        hash_completo,
    })
}

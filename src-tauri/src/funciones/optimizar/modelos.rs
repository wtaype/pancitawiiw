// src-tauri/src/funciones/optimizar/modelos.rs
// Centralización de estructuras de datos para el módulo optimizar/

use serde::{Deserialize, Serialize};

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

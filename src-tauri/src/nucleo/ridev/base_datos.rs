// src-tauri/src/nucleo/ridev/base_datos.rs
// Base de datos local ligera y cifrado simétrico mediante XOR y codificación hexadecimal
use std::fs;
use std::path::Path;

fn bytes_a_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn hex_a_bytes(hex_str: &str) -> Result<Vec<u8>, String> {
    if hex_str.len() % 2 != 0 {
        return Err("Cadena hexadecimal inválida: longitud impar".to_string());
    }
    let mut bytes = Vec::new();
    for i in (0..hex_str.len()).step_by(2) {
        let byte_str = &hex_str[i..i+2];
        let byte = u8::from_str_radix(byte_str, 16).map_err(|e| e.to_string())?;
        bytes.push(byte);
    }
    Ok(bytes)
}

pub fn cifrar_texto(texto: &str, clave: &str) -> String {
    if clave.is_empty() {
        return bytes_a_hex(texto.as_bytes());
    }
    let key_bytes = clave.as_bytes();
    let text_bytes = texto.as_bytes();
    let mut resultado = Vec::with_capacity(text_bytes.len());
    for (i, &byte) in text_bytes.iter().enumerate() {
        let key_byte = key_bytes[i % key_bytes.len()];
        resultado.push(byte ^ key_byte);
    }
    bytes_a_hex(&resultado)
}

pub fn descifrar_texto(hex_str: &str, clave: &str) -> Result<String, String> {
    let encrypted_bytes = hex_a_bytes(hex_str)?;
    if clave.is_empty() {
        return String::from_utf8(encrypted_bytes).map_err(|e| e.to_string());
    }
    let key_bytes = clave.as_bytes();
    let mut resultado = Vec::with_capacity(encrypted_bytes.len());
    for (i, &byte) in encrypted_bytes.iter().enumerate() {
        let key_byte = key_bytes[i % key_bytes.len()];
        resultado.push(byte ^ key_byte);
    }
    String::from_utf8(resultado).map_err(|e| format!("Fallo al decodificar UTF-8: {}", e))
}

pub fn guardar_json_cifrado<T: serde::Serialize>(ruta: &str, datos: &T, clave: &str) -> Result<(), String> {
    let json_str = serde_json::to_string(datos).map_err(|e| e.to_string())?;
    let cifrado = cifrar_texto(&json_str, clave);
    
    // Asegurar directorio padre
    if let Some(parent) = Path::new(ruta).parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent);
        }
    }
    
    fs::write(ruta, cifrado).map_err(|e| e.to_string())
}

pub fn leer_json_descifrado<T: serde::de::DeserializeOwned>(ruta: &str, clave: &str) -> Result<T, String> {
    let path = Path::new(ruta);
    if !path.exists() {
        return Err(format!("El archivo no existe: {}", ruta));
    }
    let cifrado = fs::read_to_string(ruta).map_err(|e| e.to_string())?;
    let json_str = descifrar_texto(cifrado.trim(), clave)?;
    serde_json::from_str(&json_str).map_err(|e| e.to_string())
}

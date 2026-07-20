// src-tauri/src/nucleo/chatwii/prompt.rs
// Gestor de prompts, instrucciones de sistema y recuperación de API Keys de Gemini
use std::path::Path;
use std::fs;

pub fn obtener_gemini_key_default() -> String {
    if let Ok(key) = std::env::var("PUBLIC_GEMINI_KEY") {
        let trimmed = key.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    if let Ok(key) = std::env::var("GEMINI_API_KEY") {
        let trimmed = key.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    
    // Fallback: leer de env.js
    let js_path = Path::new(crate::rii::RUTA_ENV_JS);
    if js_path.exists() {
        if let Ok(content) = fs::read_to_string(js_path) {
            for line in content.lines() {
                if line.contains("PUBLIC_GEMINI_KEY") {
                    let parts: Vec<&str> = line.split('"').collect();
                    if parts.len() >= 2 {
                        return parts[1].to_string();
                    }
                    let parts: Vec<&str> = line.split('\'').collect();
                    if parts.len() >= 2 {
                        return parts[1].to_string();
                    }
                }
            }
        }
    }
    String::new()
}

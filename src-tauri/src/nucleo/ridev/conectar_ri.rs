// src-tauri/src/nucleo/ridev/conectar_ri.rs
// Diagnóstico de conectividad de red y latencia a servidores de IA
use std::time::{Instant, Duration};

pub async fn medir_latencia(url: &str) -> Result<u32, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
        
    let inicio = Instant::now();
    match client.head(url).send().await {
        Ok(_) => {
            let duracion = inicio.elapsed().as_millis() as u32;
            Ok(duracion)
        }
        Err(e) => Err(format!("Fallo al conectar: {}", e)),
    }
}

pub async fn esta_online() -> bool {
    medir_latencia("https://www.google.com").await.is_ok()
}

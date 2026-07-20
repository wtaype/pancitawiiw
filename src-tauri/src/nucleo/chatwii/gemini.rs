// src-tauri/src/nucleo/chatwii/gemini.rs
// Cliente HTTP de streaming SSE de reqwest para conectar con Gemini API
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub parts: Vec<serde_json::Value>,
}

#[derive(Serialize, Debug)]
pub struct GeminiSystemInstruction {
    pub parts: Vec<GeminiPart>,
}

#[derive(Serialize, Debug)]
pub struct GeminiPart {
    pub text: String,
}

#[derive(Serialize, Debug)]
pub struct GeminiPayload {
    pub contents: Vec<ChatMessage>,
    #[serde(rename = "systemInstruction")]
    pub system_instruction: GeminiSystemInstruction,
}

pub async fn stream_chat(
    historial: Vec<ChatMessage>,
    actitud: String,
    custom_key: Option<String>,
    canal: tauri::ipc::Channel<String>,
) -> Result<(), String> {
    let api_key = match custom_key {
        Some(k) if !k.trim().is_empty() => k.trim().to_string(),
        _ => crate::nucleo::chatwii::prompt::obtener_gemini_key_default(),
    };

    if api_key.is_empty() {
        return Err("No se encontró ninguna clave de API de Gemini configurada. Por favor introdúcela en los Ajustes.".to_string());
    }

    let models_to_try = crate::rii::GEMINI_MODELOS;

    let payload = GeminiPayload {
        contents: historial,
        system_instruction: GeminiSystemInstruction {
            parts: vec![GeminiPart { text: actitud }],
        },
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
        
    let mut success = false;
    let mut last_error = String::new();

    for model in models_to_try {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?alt=sse&key={}",
            model, api_key
        );

        let response = client.post(&url)
            .json(&payload)
            .send()
            .await;

        match response {
            Ok(res) => {
                if !res.status().is_success() {
                    let status = res.status();
                    let err_text = res.text().await.unwrap_or_default();
                    last_error = format!("Modelo {} falló con status {}: {}", model, status, err_text);
                    continue;
                }

                use futures_util::StreamExt;
                let mut stream = res.bytes_stream();
                let mut buffer = String::new();

                while let Some(item) = stream.next().await {
                    match item {
                        Ok(bytes) => {
                            if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                                buffer.push_str(&text);
                                
                                loop {
                                    if let Some(pos) = buffer.find('\n') {
                                        let line: String = buffer.drain(..=pos).collect();
                                        let trimmed = line.trim();
                                        if trimmed.starts_with("data: ") {
                                            let json_str = &trimmed[6..];
                                            if json_str == "[DONE]" {
                                                continue;
                                            }
                                            if let Ok(val) = serde_json::from_str::<serde_json::Value>(json_str) {
                                                if let Some(chunk) = val["candidates"][0]["content"]["parts"][0]["text"].as_str() {
                                                    let _ = canal.send(chunk.to_string());
                                                }
                                            }
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            last_error = format!("Error leyendo stream: {}", e);
                            break;
                        }
                    }
                }
                success = true;
                break;
            }
            Err(e) => {
                last_error = format!("Fallo al conectar a {}: {}", model, e);
            }
        }
    }

    if !success {
        return Err(format!("Todos los intentos con Gemini fallaron. Detalle: {}", last_error));
    }

    Ok(())
}

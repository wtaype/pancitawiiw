// src-tauri/src/funciones/chatwii/chat.rs
// Enrutador de comandos de Tauri para el ChatWii
use crate::nucleo::chatwii::gemini::{ChatMessage, stream_chat};

#[tauri::command]
pub async fn completar_chat_comando(
    historial: Vec<ChatMessage>,
    actitud: String,
    custom_key: Option<String>,
    canal: tauri::ipc::Channel<String>,
) -> Result<(), String> {
    stream_chat(historial, actitud, custom_key, canal).await
}

// src-tauri/src/nucleo/chatwii/respuesta_chat.rs
// Procesamiento y emisión de respuestas por streaming nativo de Tauri v2

use tauri::ipc::Channel;

pub struct GestorRespuestaChat {
    canal: Channel<String>,
}

impl GestorRespuestaChat {
    pub fn nuevo(canal: Channel<String>) -> Self {
        Self { canal }
    }

    // Emitir un fragmento de texto al canal IPC del frontend
    pub fn emitir_chunk(&self, chunk: &str) -> Result<(), String> {
        self.canal
            .send(chunk.to_string())
            .map_err(|e| format!("Error al emitir chunk por IPC: {}", e))
    }
}

// src-tauri/src/puente_central.rs
// Registro unificado de comandos de Tauri mediante macro central

#[macro_export]
macro_rules! registrar_puentes {
    () => {
        tauri::generate_handler![
            // ============================================================
            // 👤 COMANDOS DEL NÚCLEO (nucleo/)
            // ============================================================

            // Puente hacia Ventana (Sonrisa y Panel)
            $crate::nucleo::ventana::ventanas::toggle_smile,
            $crate::nucleo::ventana::ventanas::fijar_sonrisa,
            $crate::nucleo::ventana::ventanas::restablecer_posiciones,

            // Puente hacia ChatWii (Asistente e IA Gemini)
            $crate::nucleo::chatwii::gemini::completar_chat_comando,
            $crate::nucleo::chatwii::gemini::chatwii_guardar_historial,
            $crate::nucleo::chatwii::gemini::chatwii_cargar_historial,

            // Puente hacia Ridev (Archivos y Directorios Genéricos)
            $crate::nucleo::ridev::carpetas::seleccionar_carpeta_comando,
            $crate::nucleo::ridev::archivos::escribir_archivo_texto_comando,
            $crate::nucleo::ridev::archivos::leer_archivo_texto_comando,

            // ============================================================
            // ⚙️ COMANDOS DE FUNCIONES DE LA APP (funciones/)
            // ============================================================

            // Puente hacia Ajustes (General y Energía)
            $crate::funciones::ajustes::ajustes::ajustes_obtener_version,
            $crate::funciones::ajustes::ajustes::fijar_estado_suspension,
            $crate::funciones::ajustes::ajustes::abrir_url_externa,
            $crate::funciones::ajustes::energia::cambiar_anti_suspension,
            $crate::funciones::ajustes::permisos::permisos_verificar_estado_sistema,

            // Puente hacia Ajustes (Cuenta de Usuario)
            $crate::funciones::ajustes::cuenta::cuenta_verificar_estado,

            // Puente hacia Ajustes (Auto-Actualizador)
            $crate::funciones::ajustes::actualizador::actualizador_obtener_version_actual,
            $crate::funciones::ajustes::actualizador::actualizador_descargar_y_actualizar,

            // Puente hacia Música (Reproductor de Audio)
            $crate::funciones::musica::musica::seleccionar_carpeta_musica_comando,
            $crate::funciones::musica::musica::descargar_cancion_youtube_comando,
            $crate::funciones::musica::musica::escanear_carpeta_musica_comando,
            $crate::funciones::musica::musica::obtener_y_escanear_musica_sistema_comando,

            // Puente hacia Duplicados (Escáner 3 Etapas y Papelera)
            $crate::funciones::duplicados::escaner_3etapas::duplicados_iniciar_escaner,
            $crate::funciones::duplicados::acciones_papelera::duplicados_eliminar_a_papelera,
            $crate::funciones::duplicados::preview_media::duplicados_obtener_metadata_archivo
        ]
    };
}

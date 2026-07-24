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

            // Puente hacia Sistema (Cierre de Aplicación y Purga de Memoria)
            $crate::nucleo::sistema::cerrar_app::cerrar_aplicacion_completa,
            $crate::nucleo::sistema::abrir_app::purgar_memoria_sistema,

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
            $crate::funciones::musica::escaner_yt::escanear_lista_youtube_comando,

            // Puente hacia Duplicados (Escáner 3 Etapas y Papelera)
            $crate::funciones::duplicados::escaner_3etapas::duplicados_iniciar_escaner,
            $crate::funciones::duplicados::acciones_papelera::duplicados_eliminar_a_papelera,
            $crate::funciones::duplicados::preview_media::duplicados_obtener_metadata_archivo,

            // Puente hacia Optimizar (Salud RAM, Vaciar Papelera y Escáner de Basura Modular)
            $crate::funciones::optimizar::ram_turbo::optimizar_obtener_estado_ram,
            $crate::funciones::optimizar::ram_turbo::optimizar_liberar_ram_turbo,
            $crate::funciones::optimizar::papelera::optimizar_vaciar_papelera_nativa,
            $crate::funciones::optimizar::analisis_general::optimizar_escanear_basura_general,
            $crate::funciones::optimizar::analisis_profundo::optimizar_escanear_basura_profundo,
            $crate::funciones::optimizar::limpiador::optimizar_ejecutar_limpieza
        ]
    };
}

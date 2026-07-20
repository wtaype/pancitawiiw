// src-tauri/src/nucleo/ridev/notificaciones.rs
// Despachador de notificaciones Toast nativas de Windows usando APIs de WindowsRuntime mediante PowerShell
pub fn lanzar_notificacion(titulo: &str, mensaje: &str) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Limpiar y escapar comillas dobles para evitar inyecciones en la cadena del script
        let titulo_escapado = titulo.replace('"', "\\\"");
        let mensaje_escapado = mensaje.replace('"', "\\\"");
        
        let ps_script = format!(
            "[Void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]; \
             $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); \
             $toastXml = [xml]$template.GetXml(); \
             $toastXml.GetElementsByTagName('text')[0].AppendChild($toastXml.CreateTextNode(\"{}\")) > $null; \
             $toastXml.GetElementsByTagName('text')[1].AppendChild($toastXml.CreateTextNode(\"{}\")) > $null; \
             $xml = New-Object Windows.Data.Xml.Dom.XmlDocument; \
             $xml.LoadXml($toastXml.OuterXml); \
             $toast = [Windows.UI.Notifications.ToastNotification]::new($xml); \
             [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('DoctorWiiApp').Show($toast);",
            titulo_escapado, mensaje_escapado
        );
        
        match crate::nucleo::ridev::consola::ejecutar_comando("powershell", &["-Command", &ps_script]) {
            Ok(_) => Ok("Notificación disparada exitosamente.".to_string()),
            Err(e) => Err(format!("Fallo al lanzar notificación nativa: {}", e)),
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        println!("Notificación (Simulación): {} - {}", titulo, mensaje);
        Ok("Simulación: Notificación disparada.".to_string())
    }
}

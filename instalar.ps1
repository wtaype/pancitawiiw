# ==============================================================================
#  Pancitawii - Script de Instalación Automática (Fase 1)
#  Repositorio: https://github.com/wtaype/pancitawiiw
# ==============================================================================

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$appName = "pancitawii"
$appDisplayName = "Pancitawii"
$repoOwner = "wtaype"
$repoName = "pancitawiiw"

# Directorio de instalación local del usuario
$installDir = Join-Path $env:LOCALAPPDATA $appDisplayName
$zipPath = Join-Path $env:TEMP "$appName.zip"
$exePath = Join-Path $installDir "$appName.exe"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "       🚀 Instalador Oficial de Pancitawii           " -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar y cerrar Pancitawii si ya se encuentra abierto
$runningProcess = Get-Process -Name $appName -ErrorAction SilentlyContinue
if ($runningProcess) {
    Write-Host "[1/5] Cerrando proceso existente de $appDisplayName..." -ForegroundColor Yellow
    Stop-Process -Name $appName -Force
    Start-Sleep -Seconds 1
} else {
    Write-Host "[1/5] Comprobando procesos existentes... OK" -ForegroundColor Green
}

# 2. Obtener URL de descarga del último Release desde GitHub
Write-Host "[2/5] Buscando la versión más reciente en GitHub ($repoOwner/$repoName)..." -ForegroundColor Cyan
$downloadUrl = ""
try {
    $apiUrl = "https://api.github.com/repos/$repoOwner/$repoName/releases/latest"
    $releaseInfo = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers @{ "User-Agent" = "Pancitawii-Installer" }
    
    $asset = $releaseInfo.assets | Where-Object { $_.name -like "*.zip" } | Select-Object -First 1
    if ($asset) {
        $downloadUrl = $asset.browser_download_url
        Write-Host "      Versión detectada: $($releaseInfo.tag_name)" -ForegroundColor Green
    } else {
        $downloadUrl = "https://github.com/$repoOwner/$repoName/releases/latest/download/pancitawii.zip"
    }
} catch {
    $downloadUrl = "https://github.com/$repoOwner/$repoName/releases/latest/download/pancitawii.zip"
}

# 3. Descargar el archivo pancitawii.zip
Write-Host "[3/5] Descargando paquete de instalación (pancitawii.zip)..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "      Descarga completada correctamente." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: No se pudo descargar 'pancitawii.zip' desde GitHub Releases." -ForegroundColor Red
    Write-Host "Asegúrate de haber creado un Release en https://github.com/$repoOwner/$repoName/releases con 'pancitawii.zip' adjunto." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 4. Crear carpeta de instalación y descomprimir
Write-Host "[4/5] Instalando en $installDir ..." -ForegroundColor Cyan
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

Expand-Archive -Path $zipPath -DestinationPath $installDir -Force

# Limpieza del comprimido temporal
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}
Write-Host "      Archivos instalados con éxito." -ForegroundColor Green

# 5. Crear accesos directos en Escritorio y Menú Inicio
Write-Host "[5/5] Creando accesos directos..." -ForegroundColor Cyan

$desktopDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$desktopShortcut = Join-Path $desktopDir "$appDisplayName.lnk"
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
$startMenuShortcut = Join-Path $startMenuDir "$appDisplayName.lnk"

$WshShell = New-Object -ComObject WScript.Shell

# Acceso directo Escritorio
$shortcut = $WshShell.CreateShortcut($desktopShortcut)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "Pancitawii App"
$shortcut.Save()

# Acceso directo Menú Inicio
$shortcutStart = $WshShell.CreateShortcut($startMenuShortcut)
$shortcutStart.TargetPath = $exePath
$shortcutStart.WorkingDirectory = $installDir
$shortcutStart.Description = "Pancitawii App"
$shortcutStart.Save()

Write-Host "      Accesos directos listos en el Escritorio y Menú Inicio." -ForegroundColor Green
Write-Host ""
Write-Host "======================================================" -ForegroundColor Yellow
Write-Host "   🎉 ¡Pancitawii se ha instalado correctamente!     " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Yellow
Write-Host ""

# Ejecutar Pancitawii
if (Test-Path $exePath) {
    Start-Process -FilePath $exePath
}

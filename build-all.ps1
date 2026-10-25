$ErrorActionPreference = "Stop"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   DEEPFLIX - BUILD MULTIPLATAFORMA AUTO    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Verifica Flutter
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Flutter SDK nao detectado no PATH do Windows." -ForegroundColor Yellow
    Write-Host "[*] Tentando localizar instalacoes padrao ou instalando..." -ForegroundColor Cyan
    
    # Testa caminhos comuns
    $possiblePaths = @("C:\flutter\bin", "C:\src\flutter\bin", "$env:LOCALAPPDATA\flutter\bin")
    $found = $false
    foreach ($p in $possiblePaths) {
        if (Test-Path "$p\flutter.bat") {
            $env:Path += ";$p"
            $found = $true
            break
        }
    }

    if (-not $found) {
        Write-Host "Instalando Flutter SDK via winget..." -ForegroundColor Cyan
        winget install --id Google.DartSDK -e --silent
    }
}

Write-Host "`n[1/3] Restaurando dependencias do projeto..." -ForegroundColor Green
flutter pub get

Write-Host "`n[2/3] Gerando APK Universal para Android (TV, Celular, Tablet, Foldable)..." -ForegroundColor Green
flutter build apk --release

Write-Host "`n[3/3] Gerando executavel nativo para Windows Desktop (.exe)..." -ForegroundColor Green
flutter build windows --release

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   BUILDS CONCLUIDOS COM SUCESSO!           " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "-> APK Android: build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Green
Write-Host "-> Windows Exe: build\windows\runner\Release\deepflix_app.exe" -ForegroundColor Green

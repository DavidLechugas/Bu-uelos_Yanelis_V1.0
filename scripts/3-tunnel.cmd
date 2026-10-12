@echo off
setlocal
cd /d "%~dp0.."
if not exist "tools\bin\cloudflared.exe" (
  echo Primero ejecuta: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-cloudflared.ps1
  exit /b 1
)
echo ATENCION: URL publica temporal. Solo demo, nunca datos personales.
echo Backend y MongoDB NO se exponen directamente. Ctrl+C cierra el tunel.
echo Copia la URL https://...trycloudflare.com de la salida.
"tools\bin\cloudflared.exe" tunnel --url http://127.0.0.1:4173 --http-host-header localhost

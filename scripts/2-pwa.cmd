@echo off
setlocal
cd /d "%~dp0..\frontend"
if not exist node_modules (
  echo Faltan dependencias. Ejecuta npm ci en frontend antes de continuar.
  exit /b 1
)
call npm run build
if errorlevel 1 exit /b 1
echo PWA local: http://127.0.0.1:4173 - deja esta ventana abierta.
call npm run preview

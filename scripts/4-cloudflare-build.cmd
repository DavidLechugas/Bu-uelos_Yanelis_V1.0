:: Construye el frontend exactamente como lo hara
:: Cloudflare Pages (para revisarlo en local), SIN
:: desplegar y SIN instalar herramientas ni usar
:: cuentas: el despliegue real lo hace el dashboard
:: de Cloudflare Pages al conectarse al repo.
::
:: Uso (CMD desde la raiz del proyecto):
::   scripts\4-cloudflare-build.cmd https://tu-backend.onrender.com
::
:: La URL es la HTTPS publica del backend en Render
:: (se incrusta en la build como VITE_API_BASE_URL;
:: es PUBLICA, no un secreto).
@echo off
setlocal
if "%~1"=="" (
  echo Falta la URL publica HTTPS del backend (Render).
  echo Ejemplo:
  echo   scripts\4-cloudflare-build.cmd https://bunuelos-yanelys-backend.onrender.com
  exit /b 1
)
cd /d "%~dp0\..\frontend"
set "VITE_API_BASE_URL=%~1"
call npm ci
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
echo.
echo Build lista en frontend\dist\.
echo El despliegue ocurre en el dashboard de Cloudflare
echo Pages (Build command: npm ci ^&^& npm run build,
echo Output: dist). Ver docs/DEPLOY.md.
endlocal

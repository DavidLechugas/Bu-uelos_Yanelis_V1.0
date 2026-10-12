# PWA en Android con Cloudflare Quick Tunnel

Demo sin autenticación real. La URL será **pública**: usar solo datos de ejemplo.
La app sigue ejecutándose en tu portátil, no se sube a un hosting.

## Inicio (CMD)

Abre CMD y ejecuta una vez:

```cmd
cd /d "D:\Proyectos personales\bunuelos-yanelys"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-cloudflared.ps1
```

Descarga oficial fijada y verificada con SHA256; ejecutable local en `tools/bin/`
(gitignored). No cambia PATH ni crea servicios. Bypass afecta solo a ese proceso.

Abre tres terminales CMD en la misma raíz del proyecto:

```cmd
:: Terminal 1: omitir si el backend ya funciona en 8080
scripts\1-backend.cmd

:: Terminal 2: build + preview de la PWA en 127.0.0.1:4173
scripts\2-pwa.cmd

:: Terminal 3: esperar a que terminal 2 muestre el servidor listo
scripts\3-tunnel.cmd
```

PowerShell: los mismos scripts funcionan anteponiendo `.\`, por ejemplo
`.\scripts\2-pwa.cmd`. El instalador puede llamarse con el comando PowerShell
anterior desde cualquiera de las dos shells.

1. Copia la URL `https://...trycloudflare.com` de la terminal 3.
2. Ábrela en Chrome de Android y espera a que cargue completamente.
3. Menú de Chrome → **Agregar a pantalla principal / Instalar aplicación**
   (nombre según versión). Abre el icono creado.
4. Conserva terminales abiertas y portátil sin suspensión. Ctrl+C detiene cada proceso.

Un único túnel apunta al preview; este reenvía `/api` al backend loopback.
MongoDB no se expone y no hay que abrir puertos del router. No uses `npm run dev`
para el túnel: el service worker pertenece al build. Preview solo sirve para esta
prueba temporal, no como servidor de producción.

## Sin conexión y actualizaciones

- La interfaz queda disponible offline tras una carga completa. Los datos
  requieren API: ni respuestas `/api` ni credenciales se cachean.
- Si falla API, se muestra error/Reintentar; datos de ejemplo solo al elegir
  explícitamente **Cargar datos de demostración**. No hay sincronización offline.
- El botón **Actualizar** aplica una nueva versión, recarga y vuelve al login
  simulado. No hay sesión persistida ni autenticación real.
- Para publicar cambios locales, detén solo terminal 2 y vuelve a iniciar
  `scripts\2-pwa.cmd`; puedes dejar el túnel abierto para conservar su URL.
- Reiniciar el túnel cambia la URL. La instalación antigua no se traslada:
  puede ser necesario desinstalarla e instalar desde la nueva dirección.

## Diagnóstico

- Comprueba primero `http://127.0.0.1:4173` en el portátil.
- `ERR_NAME_NOT_RESOLVED` es un problema DNS; espera y prueba desde el teléfono.
  Si solo falla por Wi-Fi, compara temporalmente con datos móviles.
- Cloudflare **1016** es un error DNS del origen en Cloudflare, no React.
  Reintenta más tarde; si persiste, reinicia el túnel y usa su nueva URL.
  No cambies DNS ni abras puertos a ciegas.
- Durante la comprobación externa aparecieron estos errores: la PWA local está
  probada, pero **no se ha validado instalación Android ni acceso HTTPS completo**.

Quick Tunnel gratuito, sin cuenta/dominio ni garantía de disponibilidad:
https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

## GitHub después

No hay Git inicializado ni repo publicado. Quick Tunnel no despliega al hacer push.
Para automatización acordaremos repo y hosting permanente para frontend/backend
y base accesible sin depender del portátil. No usar secretos en `VITE_*`: llegan
al navegador. La separación real en microservicios se implementará por dominios,
no creando carpetas vacías ni renombrando el backend durante esta entrega.

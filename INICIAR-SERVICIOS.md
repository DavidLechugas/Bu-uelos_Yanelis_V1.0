# Iniciar servicios y mostrar la aplicación al profesor

## ¿Dónde está alojada?

Actualmente **todo se ejecuta en el portátil**, no en un hosting permanente.
Cloudflare Quick Tunnel proporciona acceso público temporal mediante HTTPS.

| Componente | Dirección local | Acceso externo |
| --- | --- | --- |
| Frontend React/PWA (build) | http://127.0.0.1:4173 | URL HTTPS del túnel |
| Backend Spring Boot | http://127.0.0.1:8080 | Misma URL HTTPS, rutas `/api` |
| MongoDB | 127.0.0.1:27017 | Privado; no se expone |

El túnel apunta únicamente al frontend en 4173. Su proxy reenvía `/api` al
backend; no hace falta otro túnel ni abrir puertos del router.

## Encender todo (Windows CMD)

1. Comprueba que el servicio **MongoDB** esté iniciado en **Servicios de Windows**
   (`services.msc`). Compass es el cliente de administración, no el servidor.
2. Abre **tres ventanas de CMD**. En cada una entra en la raíz del proyecto:

```cmd
cd /d "D:\Proyectos personales\bunuelos-yanelys"
```

### Ventana 1 — backend

```cmd
scripts\1-backend.cmd
```

Espera al mensaje de inicio de Spring Boot. Usa Java 21 y Maven Wrapper.
Si `JAVA_HOME` ya está definido, debe apuntar al JDK 21. Si no, el script utiliza
`C:\Program Files\Java\jdk-21.0.12.1`.

Comprueba en el navegador: http://127.0.0.1:8080/api/health

### Ventana 2 — frontend/PWA

```cmd
scripts\2-pwa.cmd
```

Construye la PWA y la sirve en http://127.0.0.1:4173. Espera a que aparezca esa
dirección antes de iniciar el túnel. No necesitas `npm run dev` para esta demo.

### Ventana 3 — HTTPS

```cmd
scripts\3-tunnel.cmd
```

Copia la dirección **`https://...trycloudflare.com`** de la salida.
No reutilices una URL de una sesión anterior: cambia al reiniciar el túnel.

Si falta el ejecutable de Cloudflare, instala la copia local desde la raíz:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-cloudflared.ps1
```

No instala servicios ni modifica PATH; verifica la descarga oficial con SHA256.
Si faltan dependencias frontend, desde `frontend/` ejecuta `npm ci`.

**No arranques instancias duplicadas si los servicios ya funcionan.** Si un
puerto está ocupado por otra aplicación, consulta antes de cerrar procesos.

En PowerShell los scripts funcionan con prefijo `.\`, por ejemplo
`.\scripts\2-pwa.cmd`. No uses `$env:JAVA_HOME=...` en CMD: esa sintaxis es PowerShell.

## Qué compartir con el profesor

Sustituye `TU-URL` por la dirección actual del túnel:

- Frontend: `https://TU-URL.trycloudflare.com/`
- Salud del backend: `https://TU-URL.trycloudflare.com/api/health`
- API del dashboard: `https://TU-URL.trycloudflare.com/api/dashboard`

Explicación sugerida:

> El frontend React y el backend Spring Boot se ejecutan localmente en mi
> portátil. Cloudflare Tunnel proporciona una URL HTTPS pública para la demo.
> Las rutas /api se reenvían al backend; MongoDB permanece privado. Todavía no
> es un despliegue en hosting permanente.

## Android y límites de la demostración

- Abre la URL HTTPS en Chrome de Android → menú → **Instalar aplicación** o
  **Agregar a pantalla principal**. Espera a que termine de cargar antes.
- Mantén el portátil encendido, conectado a Internet y sin suspensión, y las
  tres terminales abiertas para consultar datos desde el teléfono/profesor.
- Reiniciar el túnel cambia el origen; la PWA instalada no cambia su dirección
  automáticamente y puede requerir reinstalación.
- La interfaz puede abrirse offline tras una carga completa, pero la API
  necesita conexión. No se cachean datos de MongoDB ni credenciales.
- **Login simulado y URL pública:** usa solo datos de demostración, nunca
  contraseñas reales ni información personal.

## Actualizar, detener y solucionar errores

- Cambios de código: detén solo la ventana 2 y vuelve a ejecutar
  `scripts\2-pwa.cmd`. Conserva el túnel abierto para mantener la URL. En la
  app acepta **Actualizar** cuando aparezca el aviso de nueva versión.
- Detener: **Ctrl+C** en cada terminal. No cierres procesos ajenos ni el servicio
  MongoDB si otras aplicaciones lo utilizan.
- Si no carga, comprueba primero el frontend local y `/api/health`.
- `ERR_NAME_NOT_RESOLVED` indica un problema DNS. Espera y prueba la URL actual
  desde el teléfono; compara con datos móviles si solo falla en Wi-Fi.
- Cloudflare **1016** indica un problema de resolución del origen: reintenta
  más tarde y, si persiste, reinicia el túnel y comparte la nueva URL.
- No cambies DNS/firewall ni abras puertos a ciegas.

Para una URL estable y acceso con el portátil apagado, habrá que desplegar
frontend, backend y base en servicios permanentes. GitHub por sí solo no aloja
Spring Boot ni MongoDB; la automatización por push queda pendiente.

Más detalles: [docs/PWA.md](docs/PWA.md) y [README.md](README.md).

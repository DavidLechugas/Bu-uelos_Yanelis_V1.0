# Buñuelos Yanelys — demo web y prototipo local

Prototipo funcional de gestión para Buñuelos Yanelys: login simulado,
tablero con datos de demostración persistidos en MongoDB y drawer de
navegación. **Demo pública sin autenticación real; no introducir datos privados.**

Aplicación: https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev

## Requisitos

- Node.js 24 y npm 11 (verificados en este equipo).
- JDK 21 en `C:\Program Files\Java\jdk-21.0.12.1` (el PATH apunta a Java 26; usar el 21 explícitamente).
- MongoDB Server 8.3 local (servicio "MongoDB", puerto 127.0.0.1:27017). Compass es el cliente, no el servidor.

## Comandos exactos (PowerShell)

```powershell
# Backend: pruebas (incluyen CORS e integración contra Mongo local)
cd 'D:\Proyectos personales\bunuelos-yanelys\backend'
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'
.\mvnw.cmd test

# Backend: ejecución (escucha SOLO en 127.0.0.1:8080, perfil dev)
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'
.\mvnw.cmd spring-boot:run

# Frontend (otra terminal)
cd 'D:\Proyectos personales\bunuelos-yanelys\frontend'
npm run lint        # ESLint
npm run test        # Vitest + Testing Library
npm run build       # Vite build -> dist/
npm run dev         # dev server en http://localhost:5173 (proxy /api -> 127.0.0.1:8080)
```

## Comandos exactos (CMD)

En CMD no sirve `$env:`; usa `set`:

```bat
cd /d "D:\Proyectos personales\bunuelos-yanelys\backend"
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1"
.\mvnw.cmd test

set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1"
.\mvnw.cmd spring-boot:run

cd /d "D:\Proyectos personales\bunuelos-yanelys\frontend"
npm run lint
npm run test
npm run build
npm run dev
```

## Arquitectura

- `frontend/` — Vite 7 + React 19 (JSX) + CSS plano. Consume la API del backend; nunca MongoDB directamente.
  - `src/components/` — Login, Header, Dashboard, StatCard, WeeklyChart (SVG, sin deps), BottomNav, Drawer, Notice.
  - `src/api/client.js` — `fetch('/api/dashboard')`; `VITE_API_BASE_URL` sobreescribible.
  - `src/hooks/useDashboard.js` — estados `loading | error | success`; el error **no se silencia**: ofrece Reintentar y un fallback de demostración a elección del usuario.
- `backend/` — Spring Boot 4.0 (Java 21) + Spring Data MongoDB, Maven Wrapper incluido (no requiere Maven global).
  - `GET /api/health` — estado del servicio.
  - `GET /api/dashboard` — lee el snapshot singleton `_id: "dashboard-demo"` de la colección `dashboard_snapshot` (base `bunuelos_yanelys`); 404 si no existe.
  - `DemoDataInitializer` — activo **solo** en perfiles `dev`/`test`; upsert con `$setOnInsert` (insert-only): **nunca sobrescribe, borra ni toca** datos existentes. El perfil `prod` no inserta nada.

## Seguridad de la demo (verificado)

- Backend local escucha únicamente en `127.0.0.1`; en hosting el perfil `prod` escucha en `0.0.0.0` y publica una API de demo solo lectura.
- Auth simulada: el login no valida, envía ni persiste credenciales; la contraseña jamás se almacena.
- Semillas solo en `dev`/`test` y no destructivas; las pruebas usan la base propia `bunuelos_yanelys_test` y solo eliminan sus propios documentos.
- No hay secretos en el repositorio.

## Estado actual

- Frontend: `lint` ✓, `test` 36/36 ✓, `build` PWA ✓; `npm audit` sin vulnerabilidades conocidas.
- Backend: última verificación local `.\mvnw.cmd package` 23/23 pruebas ✓ y JAR generado. Contenedor construido y ejecutado en Render; Actions bloqueado por facturación de cuenta, no confirmado verde.
- Demo remota verificada el 2026-10-13 en Chrome: login, tablero, inventario y gráfica; API 200 con CORS correcto. Atlas contiene solo datos de ejemplo.
- Runtime verificado con Playwright + Chrome local (login, dashboard, drawer con overlay/Escape/foco, navegación inferior, avisos honestos).
- Responsive y tipografía verificados en **320/375/768/1024/1280 px**: sin scroll horizontal; etiquetas en `rem` (15 px; heredan la preferencia de letra del navegador porque `html` no fija `font-size`); entradas 16 px; targets ≥44 px; tramos sin solapamiento (móvil / tableta 600-1024 / escritorio ≥1025 con shell `clamp(60rem, 90vw, 68rem)` y métricas 4 en fila a ancho completo); gráfica con etiquetas de días en HTML (14 px estables, alineadas con las barras); zoom CSS 200 % sin desbordamiento.
- Alcance: login + tablero + drawer. El resto de secciones avisan honestamente que no están implementadas (no son controles muertos).

## PWA Android y HTTPS temporal

Guía paso a paso (CMD y PowerShell), instalación Android y diagnóstico: **[docs/PWA.md](docs/PWA.md)**.
PWA comprobada en Chrome local: manifest, iconos, SW, interfaz offline y API no cacheada.
El túnel antiguo encontró errores DNS/Cloudflare 1016; el HTTPS del hosting actual funciona. Instalación Android aún no comprobada.
El túnel no es hosting: requiere portátil encendido y cambia URL al reiniciar.
Git conectado a `DavidLechugas/Bu-uelos_Yanelis_V1.0`, rama `main`.

## Despliegue de la demo

Hosting actual: **Cloudflare Workers Static Assets + Render Docker + Atlas**.
Backend: https://bu-uelos-yanelis-v1-0.onrender.com.
Configuración, semilla JSON y diagnóstico: **[docs/DEPLOY.md](docs/DEPLOY.md)**.
Credenciales únicamente en los dashboards, nunca en el repositorio.

## Pendiente

- **Iconos SVG en lugar de emojis** (pedido para después; los emojis actuales se mantienen hasta esa fase): ☰/✕ y 🏠📈🛵📦.
- Validar instalación real en Android y offline en hosting; confirmar auto-deploy y restricción de IPs Atlas. HTTPS y tablero remoto ya verificados.
- Autenticación real y pantallas de gestión (productos, domiciliarios, estadísticas, alertas, perfil, configuración, ventas, domicilios, inventario).

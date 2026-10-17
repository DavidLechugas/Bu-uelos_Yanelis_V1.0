# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Buñuelos Yanelys

App **interna** (administrador y domiciliarios, sin clientes ni registro público). Proyecto existente:
**no regenerar, no reinicializar Git ni MongoDB, no restaurar Inventario.** Decisiones extra en
`AGENTS.md`; guías en `docs/` (`AUTH.md`, `DEPLOY.md`).
Notas recientes reemplazan estados antiguos; código subido no implica funciones implementadas.

## Al retomar

- Comprobar `git status`/`git log -3` y conservar cambios sin confirmar.
- **No arrancar servidores locales** ni ejecutar suites solo para recuperar contexto. MongoDB local
  (servicio, 127.0.0.1:27017) queda activo: no detenerlo ni alterar datos.
- No cambiar modelos/proveedores ni lanzar subagentes premium por cuenta propia (ya fallaron por
  modelos indisponibles).

## Comandos (Windows)

Backend — siempre JDK 21 (el PATH trae Java 26); Maven no está global, usar el wrapper:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'   # CMD: set "JAVA_HOME=..."
.\mvnw.cmd test                                       # usa Mongo local con bases de prueba
.\mvnw.cmd test -Dtest=DashboardControllerTest        # una clase
.\mvnw.cmd spring-boot:run                            # 127.0.0.1:8080, perfil dev
```

Frontend:

```powershell
cd frontend
npm run lint; npm run test; npm run build
npx vitest run src/components/Dashboard.test.jsx      # tests focales
npm run dev                                           # :5173, proxy /api -> 127.0.0.1:8080
```

Verificación: cambios CSS/componente → tests focales + Chrome (Playwright `channel: 'chrome'`, ver
`AGENTS.md`) en 1–2 anchos relevantes, todos los breakpoints solo si cambia el layout. Auth/API/PWA/
backend → suites completas. Los tests nunca deben tocar Atlas real. No silenciar pruebas para lograr verde.

## Arquitectura

- `frontend/` Vite 7 + React 19 (JSX, CSS plano). `src/api/client.js` es el único punto de llamadas
  HTTP, siempre `/api` del mismo origen (cookies y CSRF); `hooks/useDashboard.js` alimenta el tablero.
  `components/` = shell (Header, Drawer, BottomNav, Login, Dashboard/WeeklyChart).
  `features/<dominio>/` = módulos de negocio: `orders/`, `couriers/`, `products/`, `profile/`,
  `settings/` (todos contra la API real; `features/inventory/` está vacío, Inventario retirado).
  Tests de UI con `src/test/mockApi.js`.
- `frontend/worker/index.js` — Cloudflare Worker: sirve `dist/` (binding `ASSETS`) y hace proxy de
  `/api` a Render (`wrangler.jsonc`). Tests en `worker/proxy.test.js`.
- `backend/` Spring Boot 4, Java 21, paquete `com.bunuelosyanelys.backend`, organizado por dominio:
  `auth/` (usuarios, sesiones, login, perfil, alta inicial), `orders/`, `couriers/`, `products/`, `dashboard/`
  (métricas en vivo desde pedidos), `health/`, `common/` (errores JSON), `config/` (SecurityConfig, CORS fail-closed). Perfil dev escucha en loopback; perfil prod exige `SPRING_MONGODB_URI`, lee
  `PORT` y escucha en 0.0.0.0. React habla solo con el backend, nunca con MongoDB/Atlas.
- Despliegue: frontend en **Cloudflare Workers Static Assets** (no Pages), backend en Render
  (`render.yaml`, `backend/Dockerfile`), datos en Atlas (`bunuelos_yanelys_demo.dashboard_snapshot`).
  - Web: https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev
  - API: https://bu-uelos-yanelis-v1-0.onrender.com
  - Un push no equivale a despliegue verificado; CI de GitHub está bloqueada por billing (no es fallo
    de código ni CI verde).

## Estado y próximo trabajo

Implementado (2026-10-14, detalle en `docs/AUTH.md`): login real con sesión en cookie HttpOnly
guardada en Mongo, CSRF, admin crea/activa/desactiva domiciliarios, pedidos con estados
Pendiente → Asignado → En camino → Entregado (+Cancelado). Admin cambia todo; el domiciliario
solo ve los suyos y marca En camino/Entregado. El primer admin sale de `ADMIN_BOOTSTRAP_*` en Render.

Además (2026-10-14, tarde): tablero calculado en vivo desde los pedidos (hora de Bogotá, refresco
cada 15 s y al volver a la pestaña), perfil propio (nombre, foto ≤160 px como data URL, cambio de
contraseña), Configuración por dispositivo (tema claro/oscuro/sistema y animaciones reducidas,
`features/settings/preferences.js` + script en `index.html`), iconos SVG propios
(`components/icons.jsx`). El snapshot demo ya no se usa en código (datos de Atlas intactos).

Además: admin edita pedidos abiertos (`PUT /api/orders/{id}`) y Productos se guarda en Mongo (`products/`, solo admin).

Pendiente: validar instalación Android. Costo de domicilio
separado: no acordado.

## Reglas

- Secretos nunca en chat/repo; URI de Atlas solo en Render. `VITE_*` es público.
- No borrar ni migrar datos de Atlas (conservar campos históricos de Inventario).
- Marca: la fuente es `docs/buñuelo.svg` (canasta de buñuelos, `#c37029`); `frontend/public/icons/logo.svg` es su recorte y de ahí salen los PNG de `public/icons/` (incluye `icon-maskable-*`). Los PNG 4K/FHD y el .rar de `docs/` son locales (ignorados).
- Toda la app lleva de fondo (montado en `main.jsx`) `components/BunueloRain.jsx` (buñuelos a línea que caen lento; trazo `currentColor`, quieto con animaciones reducidas).
- Esperas: `components/Spinner.jsx` (anillo que gira; con `done`, círculo con chulito verde que se dibuja). Pausas de confirmación en `features/feedback/timing.js` (0 en pruebas, cortas con animaciones reducidas). Botones con `aria-busy` muestran un anillo por CSS.
- Mantener paleta crema/caramelo/marrón y accesibilidad (drawer: overlay, Escape, foco); no rediseñar.
- Sin microservicios ni refactors masivos junto con auth.
- Commit/push de trabajo verificado autorizado (solo archivos necesarios); cambios de recursos cloud,
  cuentas o costes se consultan antes.
- Pendiente externo: instalación Android y offline en hosting, sin comprobar.

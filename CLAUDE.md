# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Buñuelos Yanelys

App **interna** (administrador y domiciliarios, sin clientes ni registro público). Proyecto existente:
**no regenerar, no reinicializar Git ni MongoDB, no restaurar Inventario.** Decisiones extra en
`AGENTS.md`, historial antiguo en `docs/HISTORIAL.md`; guías en `docs/` (`AUTH.md`, `DEPLOY.md`, `PWA.md`, `PRODUCTOS-INVENTARIO.md`).
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
  `components/` = shell (Header, Drawer, BottomNav, Login simulado, Dashboard/WeeklyChart).
  `features/<dominio>/` = módulos de negocio: `orders/`, `couriers/` (API real) y `products/` (demo en
  memoria). Tests de UI con `src/test/mockApi.js`.
- `frontend/worker/index.js` — Cloudflare Worker: sirve `dist/` (binding `ASSETS`) y hace proxy de
  `/api` a Render (`wrangler.jsonc`). Tests en `worker/proxy.test.js`.
- `backend/` Spring Boot 4, Java 21, paquete `com.bunuelosyanelys.backend`, organizado por dominio:
  `auth/` (usuarios, sesiones, login, alta inicial), `orders/`, `couriers/`, `dashboard/` (snapshot
  demo), `health/`, `common/` (errores JSON), `config/` (SecurityConfig, CORS fail-closed). Perfil dev escucha en loopback; perfil prod exige `SPRING_MONGODB_URI`, lee
  `PORT` y escucha en 0.0.0.0. React habla solo con el backend, nunca con MongoDB/Atlas.
- Despliegue: frontend en **Cloudflare Workers Static Assets** (no Pages), backend en Render
  (`render.yaml`, `backend/Dockerfile`), datos en Atlas (`bunuelos_yanelys_demo.dashboard_snapshot`).
  - Web: https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev
  - API: https://bu-uelos-yanelis-v1-0.onrender.com
  - Un push no equivale a despliegue verificado; CI de GitHub está bloqueada por billing (no es fallo
    de código ni CI verde).
- `scripts/*.cmd` arrancan backend/PWA/túnel local; ver `INICIAR-SERVICIOS.md`.

## Estado y próximo trabajo

Implementado (2026-10-14, detalle en `docs/AUTH.md`): login real con sesión en cookie HttpOnly
guardada en Mongo, CSRF, admin crea/activa/desactiva domiciliarios, pedidos con estados
Pendiente → Asignado → En camino → Entregado (+Cancelado). Admin cambia todo; el domiciliario
solo ve los suyos y marca En camino/Entregado. El primer admin sale de `ADMIN_BOOTSTRAP_*` en Render.

Pendiente: tablero con métricas reales de pedidos (hoy sigue siendo el snapshot demo), editar
pedidos, Productos persistente, iconos SVG, validar instalación Android. Costo de domicilio
separado: no acordado.

## Reglas

- Secretos nunca en chat/repo; URI de Atlas solo en Render. `VITE_*` es público.
- No borrar ni migrar datos de Atlas (conservar campos históricos de Inventario).
- Mantener paleta crema/caramelo/marrón y accesibilidad (drawer: overlay, Escape, foco); no rediseñar.
- Sin microservicios ni refactors masivos junto con auth.
- Commit/push de trabajo verificado autorizado (solo archivos necesarios); cambios de recursos cloud,
  cuentas o costes se consultan antes.
- Pendiente externo: instalación Android y offline en hosting, sin comprobar.

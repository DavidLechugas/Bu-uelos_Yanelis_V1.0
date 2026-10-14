# Buñuelos Yanelys — contexto del proyecto

Proyecto: `D:\Proyectos personales\bunuelos-yanelys` con `frontend/` (Vite 7 + React 19, JSX/CSS plano) y `backend/` (Spring Boot 4, Java 21, Maven Wrapper incluido). React consume la API del backend (`/api`); nunca MongoDB directamente. Espacio raíz `D:\Proyectos personales` no es Git.

## Decisiones confirmadas (usuario)

- Prototipo primero: acceso SIMULADO (no se validan ni persisten credenciales); auth real es fase posterior.
- MongoDB local (`mongodb://127.0.0.1:27017/bunuelos_yanelys`); Compass es cliente, no servidor. Backend escucha solo `127.0.0.1:8080`.
- Paleta crema/caramelo/marrón (no rediseñar). No replicar textos minúsculos ni el borde turquesa de las capturas.
- Alcance primera etapa: solo login, tablero y drawer. Las demás secciones avisan honestamente que no están implementadas (nunca controles muertos).
- Ampliación 2026-10-14 (local, aún sin publicar): vistas Productos e Inventario con estado demo en memoria, no APIs de escritura ni persistencia Atlas. Guía `docs/PRODUCTOS-INVENTARIO.md`. Productos vía drawer; Inventario vía barra inferior; búsqueda, crear/editar producto, disponibilidad y entradas/salidas con historial de sesión. Preservan estado al navegar; recarga/logout lo reinician. No sincronizan snapshot tablero ni descuentan recetas. Roles siguen simulados.
- Drawer: cierre con overlay, Escape, restauración de foco; foco atrapado; scroll del fondo bloqueado.
- PWA: `vite-plugin-pwa` solo en build; manifest e iconos PNG 192/512 maskable. `registerType: prompt`: nueva versión al pulsar Actualizar, nunca recargar formularios automáticamente.
- No guardar secretos en el workspace. No instalar herramientas globales ni alterar servicios sin autorización.

## Entorno verificado

- PATH: node v24.20.0, npm 11.19.0, git 2.55.0.
- JDK 21: `C:\Program Files\Java\jdk-21.0.12.1` (el PATH trae Java 26; siempre fijar `JAVA_HOME` al 21 para el backend).
- MongoDB Server 8.3: `C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe`, servicio "MongoDB" (Automático), puerto 27017. No hay mongosh; usar Compass o la API.
- Maven/Docker: no disponibles globalmente; usar `.\mvnw.cmd` (descarga Maven 3.10.0).
- Chrome en `C:\Program Files\Google\Chrome\Application\chrome.exe` (Playwright con `channel: 'chrome'`, sin descargar navegadores; Playwright ya está en `C:\Users\david\AppData\Local\Temp\opencode\node_modules`).

## Comandos verificados

```powershell
# Backend (PowerShell)
cd 'D:\Proyectos personales\bunuelos-yanelys\backend'
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'
.\mvnw.cmd test                 # Incluye CORS e integración Mongo local (bases de prueba)
.\mvnw.cmd spring-boot:run      # 127.0.0.1:8080, perfil dev
```

```bat
:: Backend (CMD)
cd /d "D:\Proyectos personales\bunuelos-yanelys\backend"
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1"
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

```powershell
# Frontend (PowerShell)
cd 'D:\Proyectos personales\bunuelos-yanelys\frontend'
npm run lint                    # ESLint ✓
npm run test                    # Vitest, incluye PwaStatus
npm run build                   # Vite build -> dist/ ✓
npm run dev                     # localhost:5173, proxy /api -> 127.0.0.1:8080
```

Frontend en CMD: `cd /d "D:\Proyectos personales\bunuelos-yanelys\frontend"`; los comandos npm son iguales.

## PWA y túnel (demo temporal)

- Guía Android y diagnóstico: `docs/PWA.md`. Preview no es hosting de producción.
- Desde raíz en CMD: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-cloudflared.ps1` (descarga oficial fijada + SHA256; binario local gitignored; no cambia PATH/servicios).
- Terminales separadas: `scripts\1-backend.cmd` (omitir si backend ya corre), `scripts\2-pwa.cmd` (build + preview loopback 4173), `scripts\3-tunnel.cmd` (HTTPS temporal público). PowerShell: anteponer `.\` a los scripts CMD.
- Exponer SOLO preview 4173; proxy `/api` a 8080. No exponer MongoDB ni Vite dev 5173. `--http-host-header localhost` evita `allowedHosts: true`.
- SW precachea solo interfaz; `/api` NetworkOnly y fetch `cache: no-store`. Sin servidor no hay datos actuales; fallback demo explícito. No cachear credenciales ni datos privados.
- Quick Tunnel requiere Internet y portátil activo; URL cambia al reiniciar (puede exigir reinstalar). Sin auth real: solo datos demo. Ctrl+C detiene.
- Chrome local: manifest/iconos/SW/shell offline/API no cacheada verificados. Acceso externo bloqueado por DNS (`ERR_NAME_NOT_RESOLVED`, Cloudflare 1016); no confundir URL creada con HTTPS accesible. No alterar DNS sin consultar.
- Repo Git: `https://github.com/DavidLechugas/Bu-uelos_Yanelis_V1.0.git`, rama `main`; historial remoto conservado. Usuario autorizó commit/push del proyecto. No crear recursos de pago. `VITE_*` es público, nunca secretos.

## Semilla de demostración (implementación)

`DemoDataInitializer` (@Profile dev/test) hace upsert con solo `$setOnInsert` del documento `_id: "dashboard-demo"` en `dashboard_snapshot`: si ya existe, se preserva sin sobrescribir. `prod` no inserta nada. Los tests limpian únicamente sus propios documentos.

## Despliegue demo (verificado el 2026-10-13)

- Guía paso a paso: **`docs/DEPLOY.md`**. Demo pública desplegada: frontend **Cloudflare Workers Static Assets**, backend Render y MongoDB Atlas. Pages fue el plan inicial, NO el servicio actual. Credenciales **nunca** en chat/commits.
- Frontend: `https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev`; URL workers.dev habilitada en Settings → Domains & Routes. Workers Builds: rama main, raíz frontend, build `npm run build`, deploy `npx wrangler deploy --assets ./dist --compatibility-date 2026-10-06`. Variables de COMPILACIÓN: NODE_VERSION=24 y VITE_API_BASE_URL=https://bu-uelos-yanelis-v1-0.onrender.com. No confundir con enlaces de implementación ni variables runtime.
- Backend: `https://bu-uelos-yanelis-v1-0.onrender.com`, Live confirmado por usuario. FRONTEND_ORIGIN=https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev (sin barra final). Perfil prod; URI Atlas solo en Render e incluye /bunuelos_yanelys_demo antes de ?. No registrar la URI ni la contraseña.
- Render: `backend/Dockerfile` Java 21; `render.yaml` rama main, rootDir backend, Dockerfile/context relativos a esa raíz. Perfil prod exige `SPRING_MONGODB_URI`, lee `PORT` y escucha en 0.0.0.0; dev conserva loopback. Blueprint con auto-deploy off; estado del servicio creado manualmente sin confirmar. No habilitar checksPass sin resolver primero bloqueo de Actions.
- API pública solo demo/lectura: `FRONTEND_ORIGIN` debe ser origen HTTPS exacto sin barra final ni comodines; CORS no autentica. No extrapolar configuración/fallback de Pages a Workers. La navegación actual no usa rutas URL nuevas.
- Atlas: base `bunuelos_yanelys_demo`, credenciales solo en Render; prod no siembra. Insertar únicamente snapshot demo según DEPLOY.md. Añadir IPs outbound de Render a allowlist, no abrir a todas las IPs.
- CI: frontend lint/test/build/audit; backend Java21 + Mongo8/base CI desechable y build Docker. El contenedor no se probó localmente (Docker ausente); verificar resultado en Actions. Productos/Inventario tendrán persistencia real; sus APIs de escritura requieren auth antes de publicar.
- Atlas: clúster BunuelosYanelis, usuario BunuelosApp con permiso limitado a bunuelos_yanelys_demo; documento dashboard-demo insertado manualmente en dashboard_snapshot. Campos exactos: inventarioBajo[].producto/unidades/mensaje y ventasUltimos7Dias[].dia/ventas (NO nombre/cantidad/estado ni total).
- Verificación remota: GET /api/dashboard 200 con datos correctos y cabecera CORS exacta; Chrome aislado + Playwright, login demo → tablero con $428.000, 36 pedidos, inventario y gráfica; sin errores de consola. Últimas suites locales aprobadas: frontend 36, backend 23 (no se repitieron por cambios solo documentales).
- CI: primer run bloqueado antes de ejecutar por facturación de cuenta GitHub (NO fallo de código). No afirmar CI verde ni build Docker en Actions. Render sí construyó/ejecutó su contenedor. Auto-deploy real y eliminación de 0.0.0.0/0 en Atlas aún no confirmados; verificar antes de afirmarlo. Instalación Android sigue pendiente.
- Diagnóstico resuelto: nombre de DB vacío → añadir DB en URI; Atlas error 8000/find → corregir privilegios de usuario sobre nombre exacto; 404 → falta snapshot; Failed to fetch → FRONTEND_ORIGIN. Texto de error del frontend aún menciona 127.0.0.1:8080 (pendiente contextualizar; no requiere backend local en hosting).
- Verificación local 2026-10-14: frontend lint + 49 tests + build PWA aprobados; backend sin cambios, 23 tests aprobados. Playwright+Chrome focal para nuevas vistas en 320/375/768/1024/1280, forms/nav/Escape/foco, letra preferida32px y zoom CSS200%. Se simula GET dashboard para aislar la prueba, no afirmar nuevas vistas desplegadas. Intentos coder/fast fallaron por modelos no disponibles; implementación directa. `management.css` reutiliza tokens; pequeña corrección de wrap/min-width en nav inferior para zoom. No dependencias nuevas.

## Diseño responsive y tipografía (contrato actual)

- Ajuste 2026-10-14 confirmado para móvil: shell ocupa 100% del ancho (sin límite480px), métricas como filas completas por debajo de600px y tres columnas desde600px; gráfica ocupa ancho completo del contenido, conservando margen de lectura16px. Verificado en Chrome320/375/540/599/600/768/1024/1280, letra32px y zoomCSS200%, sin overflow, drawerEscape/foco. 17tests focales dashboard/nav/App, lint y build aprobados. Este ajuste reemplaza la descripción histórica de dos columnas móvil/cuatro métricas escritorio de abajo.

- Tipografía en **rem**; NO se fija `font-size` en `html`, así que `rem` hereda el tamaño de letra preferido del navegador. (px y rem escalan igual con el zoom del navegador; lo que respeta la preferencia es no fijar px en la raíz.)
- Escala de tokens: cuerpo `1rem` · etiquetas `.9375rem` (15 px con raíz 16) · mínimo `.875rem` (14 px: badges y eje de la gráfica) · entradas `≥1rem` · títulos/valores con `clamp` (rem + vw, acotados).
- Rejillas con `minmax(0, 1fr)` para que valores largos ajusten en vez de desbordar; `.stat-value` con `overflow-wrap: break-word`.
- Tramos **explícitos y sin solapamiento**: móvil (base), tableta `600-1024 px` (shell 720 px; 840 px en 900-1024) y escritorio `≥1025 px` (shell `clamp(60rem, 90vw, 68rem)`; métricas 4 en fila a ancho completo ≈250 px/tarjeta; inventario y gráfica lado a lado).
- Gráfica (`WeeklyChart`): barras en SVG (`viewBox 320x170`, `role="img"`, `aria-label` con el total, `<title>` por barra); **etiquetas de días en HTML** (`.chart-x-axis`, grid 7 columnas con `padding: 0 8.75%` = mismo padding proporcional 28/320 de la SVG) para que su tamaño (14 px mínimo) no escala con el viewBox y queden centradas bajo cada barra (delta 0 px verificado).
- Safe-areas: `env(safe-area-inset-bottom)` en nav, main y toast; altura dinámica `100dvh`; login se compacta con `max-height: 500px` (teclado virtual simulado por viewport reducido).
- Drawer: 80 % (máx. 320 px), overlay oscuro, foco atrapado, Escape restaura foco en el botón del menú.

## Política de verificación (usuario)

- **Cambios pequeños/medianos** (CSS, un componente): verificación **focal** — Playwright+Chrome en 320/375/768/1024/1280 (login + dashboard + gráfica): sin scroll horizontal, etiquetas ≥14 px móvil / ≥15 px tableta, entradas 16 px, targets ≥44 px, drawer Escape + foco, alineación del eje de la gráfica; test de preferencia de letra (raíz 32 px) y zoom CSS 200 %; y **solo los tests focalizados** de los archivos tocados (p. ej. `npx vitest run src/App.test.jsx src/components/Dashboard.test.jsx`), no la suite completa.
- **Cambios grandes o de riesgo** (backend, auth real, API, PWA): suites completas (`npm run lint`, `npm run test`, `npm run build`, `.\mvnw.cmd test`) antes de dar por hecho el cambio.
- Scripts de verificación (no forman parte del proyecto): `C:\Users\david\AppData\Local\Temp\opencode\pw-check\` (`focal-verify.js` → `focal-report.json`, `focal-layout.js`, `focal-shots.js`).
- Si los servidores del usuario ya corren (5173/8080), reusarlos; si no, arrancar los propios y cerrar **solo los propios** por puerto al terminar. No matar procesos ajenos.

## Pendientes

- Proxy ya publicado tras commits `bcc378c`, `755686c`, `e2e1771`: web remota comprobada en Chrome375x812 con Inicio/Pedidos/Domicilios, dashboard Render200/Atlas y GETWorker/api/health200. Login aún simulado, no cuentas/pedidos reales. Frontend aún compila VITE_API_BASE_URL absoluto: antes de auth quitarlo y rebuild para usar proxy same-origin. Actions run38622997955 falló antes de iniciar jobs por billing GitHub, confirmado por anotaciones; no fallo de código ni CIverde.
- Siguiente trabajo solicitado: Pedidos y Domicilios funcionales, administrador crea domiciliarios directamente y asigna pedidos; cada domiciliario solo ve los propios. Propuesta de campos del pedido cliente/teléfono/dirección/detalle/total/asignación; aún sin confirmar detalle del formulario. Implementar login/autorización primero, no nuevas escrituras públicas inseguras ni datos personales en demo. No inventar estados o campos como requisitos confirmados.

- Cambio de alcance 2026-10-14: **Inventario NO necesario**; eliminado módulo frontend demo y navegación/resumen bajo stock; no borrar snapshot ni datos Atlas. Administrador crea domiciliarios directamente, SIN registro público; objetivo gestionar/asignar pedidos. Aún NO implementado login real ni pedidos/cuentas. Corrección móvil: error no exige backend en127.0.0.1, fetch timeout90s y aviso de arranque. Frontend73tests/lint/build/audit y Chrome focal320-1280/letra32px/zoom200% aprobados. Pruebas Inventario retiradas con funcionalidad, reemplazadas por ausencia en navegación/dashboard. Diagnóstico remoto: API frontend404 (proxy sin publicar), primer health Render timeout65s, luego dashboard200/CORS correcto/Chrome remoto funciona con navegación antigua. No afirmar causa exacta de captura ni deploy automático. Subagente coder falló por modelo indisponible.

- 2026-10-14: usuario confirmó login real con objetivo **Atlas + hosting + teléfono**, no persistencia solo local. Autorizó proxy `/api` en Worker existente y primera cuenta admin sin registro público. Preparado `frontend/worker/` + `wrangler.jsonc`, NO desplegado. Guía `docs/AUTH.md`: etapas y organización por dominio. **Auth real y persistencia negocio aún NO implementadas**, no usar contraseñas reales en login actual. Proxy no sustituye permisos/CSRF backend. Para futuro deploy: quitar VITE_API_BASE_URL compilación y usar `npx wrangler deploy --config wrangler.jsonc`; no aplicar cambios cloud automáticamente. Subagente deep indisponible; no cambiar modelo.

- **Iconos SVG en lugar de emojis** (pedido del usuario para DESPUÉS; NO reemplazar ahora): ☰/✕ del header/drawer y 🏠📈🛵📦 de la navegación inferior.
- HTTPS público y tablero remoto verificados; validar instalación Android y offline en hosting, confirmar auto-deploy y restringir allowlist Atlas a rangos outbound de Render.
- Auth real y pantallas de gestión.

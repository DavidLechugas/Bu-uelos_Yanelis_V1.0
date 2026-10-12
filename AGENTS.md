# Buñuelos Yanelys — contexto del proyecto

Proyecto: `D:\Proyectos personales\bunuelos-yanelys` con `frontend/` (Vite 7 + React 19, JSX/CSS plano) y `backend/` (Spring Boot 4, Java 21, Maven Wrapper incluido). React consume la API del backend (`/api`); nunca MongoDB directamente. Espacio raíz `D:\Proyectos personales` no es Git.

## Decisiones confirmadas (usuario)

- Prototipo primero: acceso SIMULADO (no se validan ni persisten credenciales); auth real es fase posterior.
- MongoDB local (`mongodb://127.0.0.1:27017/bunuelos_yanelys`); Compass es cliente, no servidor. Backend escucha solo `127.0.0.1:8080`.
- Paleta crema/caramelo/marrón (no rediseñar). No replicar textos minúsculos ni el borde turquesa de las capturas.
- Alcance primera etapa: solo login, tablero y drawer. Las demás secciones avisan honestamente que no están implementadas (nunca controles muertos).
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

## Despliegue demo (fase staging — SOLO preparación local)

- Guía paso a paso: **`docs/DEPLOY.md`**. Nada desplegado; todo se configura en los dashboards (Render, Cloudflare, Atlas). Credenciales **nunca** en chat/commits.
- Render: `backend/Dockerfile` Java 21; `render.yaml` rama main, rootDir backend, Dockerfile/context relativos a esa raíz. Perfil prod exige `SPRING_MONGODB_URI`, lee `PORT` y escucha en 0.0.0.0; dev conserva loopback. Auto-deploy apagado hasta validar el primer despliegue, después habilitar checksPass.
- API pública solo demo/lectura: `FRONTEND_ORIGIN` debe ser origen HTTPS exacto sin barra final ni comodines; CORS no autentica. En Pages configurar `VITE_API_BASE_URL` con URL HTTPS pública de Render y `NODE_VERSION=24`. SPA fallback automático sin 404.html.
- Atlas: base `bunuelos_yanelys_demo`, credenciales solo en Render; prod no siembra. Insertar únicamente snapshot demo según DEPLOY.md. Añadir IPs outbound de Render a allowlist, no abrir a todas las IPs.
- CI: frontend lint/test/build/audit; backend Java21 + Mongo8/base CI desechable y build Docker. El contenedor no se probó localmente (Docker ausente); verificar resultado en Actions. Productos/Inventario tendrán persistencia real; sus APIs de escritura requieren auth antes de publicar.
- Estado: suites locales verdes (frontend 36, backend 9 con los 2 nuevos de CORS). Pendiente: validar cuentas y desplegar vía dashboards (usuario), luego activar autoDeploy a propósito.

## Diseño responsive y tipografía (contrato actual)

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

- **Iconos SVG en lugar de emojis** (pedido del usuario para DESPUÉS; NO reemplazar ahora): ☰/✕ del header/drawer y 🏠📈🛵📦 de la navegación inferior.
- Validar HTTPS e instalación Android; hosting permanente y GitHub después.
- Auth real y pantallas de gestión.

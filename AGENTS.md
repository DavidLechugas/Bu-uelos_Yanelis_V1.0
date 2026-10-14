# Buñuelos Yanelys — contexto del proyecto

Estado vigente, comandos y arquitectura: **`CLAUDE.md`** (válido para cualquier agente). Este archivo
solo añade lo que no está allí. Historial completo de decisiones y verificaciones: `docs/HISTORIAL.md`
(consultar solo si hace falta un detalle antiguo).

## Decisiones confirmadas (usuario)

- App interna: admin y domiciliarios; sin clientes ni registro público. Inventario retirado.
- Pedidos: cliente, teléfono, dirección, detalle, totalCOP, domiciliario opcional (asignable después).
  Estados y costo de domicilio sin definir: preguntar, no inventar.
- Login real primero; ninguna escritura ni dato personal expuesto antes de auth y permisos en servidor.
- PWA: `vite-plugin-pwa` solo en build, `registerType: prompt` (actualiza al pulsar, nunca recarga
  formularios sola). SW precachea solo la interfaz; `/api` NetworkOnly. Guía `docs/PWA.md`.
- Iconos SVG en lugar de emojis: pedido para DESPUÉS, no ahora.

## Entorno

- node 24, npm 11, git 2.55 en PATH. JDK 21 en `C:\Program Files\Java\jdk-21.0.12.1` (PATH trae 26).
- MongoDB 8.3 como servicio en 127.0.0.1:27017 (sin mongosh; usar Compass o la API). Maven/Docker no
  globales: `.\mvnw.cmd`.
- Chrome instalado; Playwright en `C:\Users\david\AppData\Local\Temp\opencode\node_modules`
  (`channel: 'chrome'`, sin descargar navegadores).
- Comandos en CMD: igual que PowerShell, con `cd /d "<ruta>"` y `set "JAVA_HOME=..."`.

## Hosting (detalle en `docs/DEPLOY.md`)

- Workers Builds (Cloudflare): rama main, raíz `frontend`, build `npm run build`; variables de
  compilación `NODE_VERSION=24` y, de momento, `VITE_API_BASE_URL` (Render absoluto).
- Render: `FRONTEND_ORIGIN` = URL exacta de Workers, sin barra final; URI de Atlas solo allí.
- Atlas: clúster BunuelosYanelis, base `bunuelos_yanelys_demo`, usuario de permisos limitados, doc
  `dashboard-demo` en `dashboard_snapshot` (campos `ventasUltimos7Dias[].dia/ventas`).
- `DemoDataInitializer` (perfiles dev/test) hace upsert con solo `$setOnInsert`; prod no siembra.
- Sin confirmar: auto-deploy de Render, retirar `0.0.0.0/0` de Atlas, instalación Android, offline en
  hosting. CI de GitHub bloqueada por billing.

## Diseño (contrato)

- Paleta crema/caramelo/marrón, tipografía en `rem` sin fijar `font-size` en `html`; mínimo `.875rem`,
  entradas `≥1rem`, objetivos táctiles ≥44 px. Rejillas con `minmax(0, 1fr)`.
- Tramos: móvil base, tableta 600–1024 (contenido 720 px; 840 px en 900–1024), escritorio ≥1025
  (`clamp(60rem, 90vw, 68rem)`). `--content-max` limita el contenido; encabezado y barra inferior
  ocupan siempre todo el ancho.
- Animaciones cortas (transform/opacity), desactivadas con `prefers-reduced-motion`.
- Gráfica: barras SVG (`viewBox 320x170`) + eje de días en HTML (`padding 0 8.75%`).

## Verificación

- CSS/componente: tests focales + Chrome en anchos relevantes (todos 320/375/768/1024/1280 solo si cambia
  el layout), letra 32 px y zoom 200 % cuando toque tipografía.
- Backend/auth/API/PWA: suites completas (`npm run lint/test/build`, `.\mvnw.cmd test`).
- Reusar servidores del usuario si corren; si se arrancan propios, cerrarlos por puerto al terminar.

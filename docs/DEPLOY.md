# Despliegue de la demo — Cloudflare Workers + Render + MongoDB Atlas

> Trabajo en curso (2026-10-14): el usuario autorizó **login real y proxy
> `/api` same-origin**. Código del proxy preparado, NO desplegado; login
> todavía simulado. Ver **[AUTH.md](AUTH.md)** para los cambios posteriores
> de build/deploy. Los comandos de abajo describen la demo remota anterior,
> no el futuro despliegue autenticado.

Guía para publicar la **demostración pública de solo lectura**
(login simulado, tablero con snapshot de demo, drawer).
**No es producción**: la demo no tiene autenticación real y
sirve datos de demostración. La auth real es una fase posterior.

> Estado actual (2026-10-13): **demo pública desplegada y tablero verificado en Chrome**.
> Las credenciales se configuran **solo en los dashboards** de
> cada proveedor (Render, Cloudflare, Atlas). **Nunca** pegar
> URIs, usuarios ni contraseñas en el chat, issues ni commits.

## Arquitectura actual

| Parte | Dónde | Notas |
| --- | --- | --- |
| Frontend (React) | **Cloudflare Workers Static Assets** | Estático (`dist/`), HTTPS |
| Backend (Spring Boot) | **Render** (contenedor Docker) | API de solo lectura `/api` |
| MongoDB | **Atlas** (cluster M0, DB demo propia) | No migrar las DBs locales |

El navegador carga el frontend desde Workers y la API desde
Render (orígenes distintos → CORS con origen exacto, ver
`ApiCorsConfig`).

- Aplicación: https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev
- Backend: https://bu-uelos-yanelis-v1-0.onrender.com
- Datos de demo: https://bu-uelos-yanelis-v1-0.onrender.com/api/dashboard
- Atlas: clúster `BunuelosYanelis`, base `bunuelos_yanelys_demo`,
  colección `dashboard_snapshot`, documento `_id: "dashboard-demo"`.

Pages fue el plan inicial; el despliegue actual usa Workers. No hace
falta mantener el portátil encendido para acceder a esta demo.

## 0. Antes de empezar

- Cuentas y servicios configurados por el usuario en **Cloudflare**,
  **Render** y **MongoDB Atlas**.
- Repositorio: `DavidLechugas/Bu-uelos_Yanelis_V1.0`; rama
  confirmada `main`. Se conserva su historial al subir el proyecto.
- El backend local (8080), Vite (5173/4173) y Mongo local
  (27017) pueden seguir corriendo: este proceso no los toca.

## 1. MongoDB Atlas (DB de demo propia)

1. Crear cluster **M0 (free)** en la región más cercana a
   Oregón (Render por defecto despliega en `oregon`): AWS
   `us-west-2` (Oregon).
2. Crear **base de datos propia de demo** (p. ej.
   `bunuelos_yanelys_demo`). **No** migrar ni conectar las
   bases locales (`bunuelos_yanelys`, `*_test`).
3. Crear usuario de **mínimo privilegio**: `readWrite`
   **solo** sobre esa base de demo (la API solo lee; el
   permiso de escritura cubre la siembra manual del paso 2).
   Si prefieres sembrar desde tu usuario admin y que la app
    solo lea, usa el rol `read` sobre la demo.
4. **IP Access List** (Network Access):
   - **Preferred**: copiar los **rangos outbound de Render**
     del dashboard (servicio → *Connect* → pestaña *Outbound*;
     ver [docs de Render](https://render.com/docs/outbound-ip-addresses)).
     Render publica rangos CIDR por región; añade esos CIDR
     (p. ej. el rango de Oregon) con comentario "render".
   - **No** añadir `0.0.0.0/0` sin entenderlo: abre la DB a
     cualquier IP de internet. Solo considéralo si el cluster
     es de pruebas desechable y **ningún** dato real existe;
     la app de todos modos exige credenciales.
   - Los rangos outbound son **compartidos** entre servicios
     de la misma región y pueden cambiar; si Atlas no acepta
     rangos grandes o necesitas IPs fijas, Render ofrece
     [Dedicated IPs](https://render.com/docs/dedicated-ips)
     (de pago). Verifica precio actual antes.
5. **Connection string**: *Database → Connect → Connect your
   application* → driver Java/Sync. **Codifica** (percent-
   encoding) usuario y contraseña (ej. `p@ss` → `p%40ss`)
   antes de armar la URI. La URI completa es un secreto:
   solo se pega en el dashboard de Render (paso 3). No la
   loguees ni la compartas.

### 2. Semilla de demostración (manual, una sola vez)

El perfil `prod` **no siembra nada** (a propósito). Inserta
a mano el documento singleton en la colección
`dashboard_snapshot` de la DB demo (Compass o Atlas UI →
*Collections* → *Add Data* → *Insert Document*):

```json
{
  "_id": "dashboard-demo",
  "saludo": "Buenos días, Ana",
  "ventasTotales": 428000,
  "pedidos": 36,
  "alertas": 3,
  "entregasActivas": 4,
  "inventarioBajo": [
    { "producto": "Queso costeño", "unidades": 2, "mensaje": "revisar" }
  ],
  "ventasUltimos7Dias": [
    { "dia": "Lun", "ventas": 52000 },
    { "dia": "Mar", "ventas": 61000 },
    { "dia": "Mié", "ventas": 47000 },
    { "dia": "Jue", "ventas": 58000 },
    { "dia": "Vie", "ventas": 72000 },
    { "dia": "Sáb", "ventas": 68000 },
    { "dia": "Dom", "ventas": 70000 }
  ]
}
```

(Valores de ejemplo del `DemoDataInitializer`; cámbialos si
quieres que la demo muestre otros números.)

## 3. Render — backend (contenedor)

1. En el dashboard de Render: *New +* → *Web Service* →
   conectar el repo GitHub (`DavidLechugas/Bu-uelos_Yanelis_V1.0`).
   Elige la rama `main`.
2. Configuración (equivale a `render.yaml`, que también puede
   importarse como Blueprint):
   - **Runtime/Language**: Docker
   - **Root directory**: `backend`
    - **Dockerfile path**: `./Dockerfile`
    - **Docker build context**: `.` (ambos relativos a `backend`,
      según [la guía de monorepos](https://render.com/docs/monorepo-support)).
   - **Plan**: `free` — **verifica** en
     [render.com/pricing](https://render.com/pricing) el
     precio y los límites actuales (los términos del tier
     free cambian; no dar por sentado que es gratis).
   - **Health check path**: `/api/health` (solo liveness:
     no consulta MongoDB; la app arranca aunque la DB tarde).
   - **Auto-deploy**: dejarlo **apagado** (`autoDeployTrigger:
     off` en `render.yaml`) hasta validar la demo; luego
     actívalo a propósito.
3. **Environment variables** (se crean en el dashboard;
   en `render.yaml` figuran con `sync: false` para que el
   dashboard las pida):
   - `SPRING_PROFILES_ACTIVE` = `prod`
   - `SPRING_MONGODB_URI` = la URI de Atlas (secreto,
     usuario/contraseña codificados). **Fail closed**: sin
     ella la app no arranca.
   - `FRONTEND_ORIGIN` = la URL **exacta** del frontend en
     Cloudflare Workers (ver paso 4), sin barra final.
4. Deploy. Verifica en la URL `onrender.com` del servicio:
   - `GET /api/health` → `{"status":"UP",...}` (liveness).
   - `GET /api/dashboard` → el snapshot de la semilla (404
     si no se insertó el documento del paso 2).

> Render inyecta `PORT`; la app lo lee
> (`server.port=${PORT:8080}`) y escucha en `0.0.0.0`
> **solo** con el perfil `prod` (en dev sigue siendo
> `127.0.0.1`).

## 4. Cloudflare Workers — frontend actual

En el Worker existente → **Settings → Build**, configurar:

| Campo | Valor |
| --- | --- |
| Rama de producción | `main` |
| Directorio raíz | `frontend` |
| Comando de compilación | `npm run build` |
| Implementar comando | `npx wrangler deploy --assets ./dist --compatibility-date 2026-10-06` |
| Disable builds | Apagado |

En **Variables y secretos de compilación** (no enlaces de implementación):

- `NODE_VERSION` = `24`
- `VITE_API_BASE_URL` = `https://bu-uelos-yanelis-v1-0.onrender.com`

Guardar y reintentar compilación. En **Settings → Domains & Routes**,
habilitar la URL `workers.dev` si aparece "No hay direcciones URL habilitadas".
En Render, `FRONTEND_ORIGIN` debe ser exactamente
`https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev`.
Tras cambiar variables en Render, guardar y redesplegar; cambiar
`VITE_API_BASE_URL` requiere recompilar el frontend.

No subir la URI de Atlas ni credenciales a Cloudflare. Los valores
`VITE_*` se incluyen públicamente en JavaScript.

Referencias oficiales: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
y [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

### Alternativa no utilizada: Cloudflare Pages

Lo siguiente describe el plan inicial, no el formulario del Worker actual.

1. Dashboard de Cloudflare → *Workers & Pages* → *Create
   application* → *Pages* → *Connect to Git* → mismo repo.
   **Production branch**: `main`.
2. Build settings:
   - **Root directory**: `frontend`
   - **Build command**: `npm ci && npm run build`
   - **Build output directory**: `dist`
3. **Environment variables** (del proyecto Pages, no de la
   cuenta):
   - `VITE_API_BASE_URL` = `https://<tu-servicio>.onrender.com`
     (**obligatoria** para la build de Pages: es pública, no
     secreta; sin ella el frontend llamaría a `/api` del mismo
     origen Pages, que no existe). En dev local puede quedar
      vacía (proxy de Vite).
   - `NODE_VERSION` = `24` (coincide con la versión verificada).
4. Deploy. La primera build tarda unos minutos.

### Notas verificadas de Cloudflare Pages

- **SPA fallback automático**: Pages asume SPA cuando **no**
  hay un `404.html` de nivel superior y sirve `index.html`
  para rutas que no coinciden con un activo
  ([docs](https://developers.cloudflare.com/pages/configuration/serving-pages/)).
   La build no genera `404.html`; no necesitamos añadir reglas SPA
   en `_redirects` para las vistas actuales.
- **`_headers`** (ya incluido en `frontend/public/_headers`,
  se copia a `dist/`): `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  no-referrer` en `/*`
  ([docs](https://developers.cloudflare.com/pages/configuration/headers/)).
  **CSP omitida a propósito**: añadir una política sin
  revisión puede romper el inline del demo; si se quiere CSP,
  consúltala con pruebas reales antes.
- **Service worker**: sin cambios. El precache cubre solo
  activos estáticos; `/api` es `NetworkOnly` (regex
  `/\/api\//` también matchea la URL absoluta del backend) y
  `fetch` usa `cache: 'no-store'`: la API nunca se cachea
  ni desde el SW ni desde la HTTP cache.
- Pages añade por defecto `Access-Control-Allow-Origin: *`
  a los **activos estáticos** (públicos, inofensivo); el
  CORS de la API lo controla el backend, no Pages.

## 5. Verificación de la demo desplegada

1. `GET <backend>/api/health` → `{"status":"UP"}`
   (liveness; no toca la DB).
2. `GET <backend>/api/dashboard` → JSON del snapshot
   (confirma la semilla manual y la allowlist de Atlas).
3. Abre la URL de Workers → login simulado → tablero con los
   datos de demo. Si el tablero no carga:
   - Console del navegador: error CORS → `FRONTEND_ORIGIN`
     (Render) no coincide **exactamente** con el origen de
     Workers (protocolo + host, sin barra final).
   - 404 de `/api/dashboard` → revisar URL y documento de semilla.
   - 500 de `/api/dashboard` → consultar logs runtime de Render;
     no cambiar configuración sin identificar la causa.
4. PWA: manifest e iconos se sirven desde Cloudflare; el SW
   sigue sin cachear `/api`.

Verificado el 2026-10-13: API 200, datos correctos y CORS exacto;
Chrome aislado con Playwright muestra tablero, inventario y gráfica sin
errores de consola. Instalación Android y offline en hosting aún pendientes.

Diagnóstico de errores encontrados:

- `Database name must not be empty`: falta `/bunuelos_yanelys_demo` en URI.
- Atlas `8000`, `user is not allowed to do action [find]`: corregir permiso
  sobre la base exacta; no abrir la red para resolver un error de autorización.
- 404 en `/api/dashboard`: falta el documento `dashboard-demo`.
- Campos en cero/null: respetar nombres del JSON de la sección 2.
- `Failed to fetch`: revisar CORS y URL compilada. El texto sobre
  `127.0.0.1:8080` del prototipo no aplica al despliegue remoto.

## 6. CI (GitHub Actions)

`.github/workflows/ci.yml` corre en cada push/PR:

**Estado conocido:** el primer run no inició por un bloqueo de facturación
de la cuenta GitHub. No se ha confirmado CI verde. El Dockerfile sí fue
construido y ejecutado en Render; Docker sigue ausente localmente.

- **frontend**: `npm ci`, `lint`, `test`, `build`.
- **backend**: Java 21 (Temurin) + servicio `mongo:8`
  (27017) + `./backend/mvnw --batch-mode test` con
  `SPRING_MONGODB_URI=mongodb://localhost:27017/bunuelos_yanelys_ci`
  (base CI propia controlada). Los tests con
   `@ActiveProfiles("test")` usan `bunuelos_yanelys_test` en local;
   en CI la variable de entorno tiene prioridad y las pruebas usan
   la base desechable `bunuelos_yanelys_ci`.
  Ningún test toca una base de datos real ni despliega:
   **no hay** tokens ni secretos en el workflow.
   Después se construye la imagen Docker de Render. Docker no está
   instalado localmente: no afirmar que el contenedor se verificó aquí;
   el resultado de esa comprobación se verá en GitHub Actions.

## 7. Seguridad y límites de la demo

- **Pública y sin auth real**: cualquiera con la URL ve la
  demo. No poner datos reales en la DB demo.
- La API de demo es de **solo lectura** (`GET /api/...`);
   CORS restringido al origen exacto, credenciales `false`.
   CORS no es autenticación: otros clientes pueden consultar la demo.
- Secrets (URI de Atlas) **solo** en dashboards (Render);
  `VITE_API_BASE_URL` es pública.
- Costes: este documento no afirma precios actuales. Verifica
  las páginas de precios de Render, Cloudflare y Atlas antes
  de crear recursos (los tiers free y sus límites cambian).

## 8. Deshacer

- Render: pausar/eliminar el servicio (dashboard).
- Cloudflare Workers: deshabilitar builds y URL pública, o eliminar el Worker.
- Atlas: eliminar el cluster M0 de demo.

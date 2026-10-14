# Login real para web y teléfono

## Estado — 2026-10-14: IMPLEMENTADO (etapas 2 y 3)

- **Sesión:** cookie `by_session` HttpOnly, SameSite=Lax, Secure en prod, sin Domain;
  token aleatorio de 256 bits, en Mongo solo su SHA-256 (`auth_sessions`, índice TTL,
  7 días). Sobrevive a reinicios de Render. Logout, desactivar o cambiar contraseña revocan.
- **CSRF:** cookie `XSRF-TOKEN` + cabecera `X-XSRF-TOKEN` (Spring Security). La emite
  `GET /api/auth/session` (pública, devuelve `{usuario: null}` sin sesión).
- **Contraseñas:** BCrypt (`DelegatingPasswordEncoder`), 8–72 caracteres. Bloqueo de 15 min
  tras 5 fallos por usuario (en memoria). Mensaje genérico exista o no la cuenta.
- **Primer admin:** variables de Render `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_PASSWORD`
  (y opcional `ADMIN_BOOTSTRAP_NAME`). Solo se usan si no existe ningún admin; borrarlas tras
  el primer acceso. Nunca en el repo ni en el chat.
- **API:** `/api/auth/{session,login,logout}`; `/api/couriers` (ADMIN: listar, crear,
  `PATCH /{id}/activo`, `PUT /{id}/password`); `/api/orders` (GET por rol, POST admin,
  `PUT /{id}/domiciliario` admin, `PATCH /{id}/estado` con transiciones validadas en
  `OrderService`). `/api/dashboard` ahora exige ADMIN. Resto: `denyAll`.
- **Frontend:** siempre `/api` mismo origen (Vite proxy en local, Worker en hosting);
  `VITE_API_BASE_URL` ya no se lee. Vistas `features/orders` y `features/couriers`.
- Pruebas: backend 39 (integración real con Mongo `bunuelos_yanelys_test`), frontend 83,
  E2E Chrome local con backend real (base `bunuelos_yanelys_e2e`, desechable).

Lo que sigue abajo es el plan original; se conserva como referencia.

## Objetivo confirmado — 2026-10-14

Mantener Cloudflare Workers + Render + MongoDB Atlas. No depender del
portátil para usar la aplicación ni guardar credenciales en el frontend.
Primera cuenta administradora, sin registro público. El rol lo determina
el servidor, nunca el selector del formulario. El usuario autorizó adaptar
el Worker existente para reenviar `/api` a Render.

**Cambio de alcance confirmado:** el administrador crea directamente las
cuentas de los domiciliarios. No invitaciones ni registro público. El negocio
se centra en crear pedidos y asignarlos a domiciliarios. **Inventario retirado**
de la interfaz y del alcance; conservar datos existentes de Atlas.

**Usuarios internos solamente**, confirmado por el usuario: administrador y
domiciliarios encargados. Los clientes NO tienen cuentas ni registro ni
acceso a la app. Sus datos se usan únicamente para registrar/entregar pedidos.

Campos iniciales del pedido confirmados: cliente, teléfono, dirección,
detalle, total en COP y domiciliario opcional al crear (asignable después).
No se confirmó costo de domicilio separado. Estados concretos y reglas de
modificación todavía por definir. El acceso a estos datos requiere login y
permisos en el servidor; no publicarlos como parte de la demo anónima.

**Estado: implementación por etapas. El login sigue simulado.** No hay
usuarios reales, sesiones autenticadas ni escrituras de pedidos/domiciliarios
todavía. No introducir contraseñas reales en la pantalla actual.

## Etapa 1: proxy same-origin (publicado; login todavía pendiente)

Comprobación posterior al envío de `e2e1771`: Worker `/api/health` responde
200 y la interfaz nueva se ve en Chrome móvil. **React todavía llama al
origen absoluto Render por la variable compilada anterior**; antes de
activar autenticación hay que quitarla y recompilar para usar el proxy.

`frontend/worker/index.js` recibe `/api` y `/api/*` en el dominio del
frontend y llama exclusivamente al backend Render ya existente.
`frontend/wrangler.jsonc` define el Worker, `ASSETS`, SPA y prioridad de
las rutas API. La interfaz estática sigue pública.

- Destino HTTPS exacto allowlisted; no es un proxy abierto.
- Cuerpo, cookie y cabecera CSRF se transmiten sin registrarlos.
- No se confía en cabeceras de identidad o proxy del navegador.
- Escrituras requieren `Origin` igual al de la app. Esto es defensa
  adicional, **no sustituye autenticación, permisos ni CSRF del backend**.
- No se siguen redirecciones del backend.
- API sin caché, también respuestas de error; no se debilita el SW existente.
- Cookies deben emitirse desde el backend sin atributo Domain, HttpOnly,
  Secure, SameSite=Lax o Strict y Path=/ para funcionar bajo el dominio web.
- No hay URI de Atlas ni contraseñas en Cloudflare. Solo Render accede a Atlas.

### Cambio de despliegue, cuando se publique esta etapa

En **el Worker existente**, no crear otra aplicación:

1. Mantener raíz `frontend` y build `npm run build`.
2. Cambiar deploy de `npx wrangler deploy --assets ./dist ...` a
   `npx wrangler deploy --config wrangler.jsonc`.
3. Eliminar la variable de compilación `VITE_API_BASE_URL` (o dejarla
   vacía), para que React use `/api` del mismo origen. No basta cambiar una
   variable runtime: hay que recompilar el frontend.
4. El origen público no cambia. `API_ORIGIN` no es secreto y ya está
   declarado en el archivo Wrangler. No pegar la URI de Atlas aquí.
5. Comprobar `/api/health` y `/api/dashboard` **desde workers.dev** y que
   `/api/inexistente` devuelve respuesta del backend, no HTML de la SPA.

Pruebas iniciales del handler en Node con Fetch estándar. Wrangler no se
instaló ni ejecutó localmente. Posteriormente se envió a GitHub y se verificó
el despliegue real con GET `/api/health` del dominio Worker y la nueva UI en
Chrome aislado tamaño móvil. La instalación Android y sesiones reales siguen
sin verificarse.

Verificación local: 25 pruebas del proxy; suite completa frontend 74/74,
lint y build PWA aprobados. Una inversión deliberada del guard de origen
hizo fallar 22 pruebas; se restauró y las 25 focales volvieron a pasar.
Backend sin cambios ni nuevas dependencias. Servidores de desarrollo
conservados; no se insertaron usuarios/documentos ni se alteró Atlas.

Referencia oficial revisada:
https://developers.cloudflare.com/workers/static-assets/binding/

## Etapa 2: autenticación (pendiente)

Implementar con Spring Security, sin inventar criptografía propia:

- Usuarios en Atlas, contraseña con hash adaptativo y rol del servidor.
- Alta inicial de administrador por un procedimiento privado; sin cuenta
  ni contraseña de fábrica, sin ruta de registro público.
- El administrador crea cuentas con rol Domiciliario impuesto por el servidor;
  el domiciliario no puede crear usuarios ni asignarse permisos administrativos.
- Sesión revocable y de duración limitada con cookie HttpOnly + Secure.
  Elegir y probar almacenamiento de sesión, incluidos reinicios de Render.
- Protección CSRF, rotación de sesión al entrar, invalidación al salir,
  respuestas JSON 401/403 y restauración de sesión al recargar.
- Limitación de intentos y respuestas genéricas ante credenciales erróneas.
- Denegar acceso anónimo a datos privados y escrituras; health público.
- Tests de contraseña incorrecta, rol falsificado, CSRF, sesión expirada,
  logout, acceso directo a Render y uso desde el proxy.

## Etapa 3: persistencia de negocio (pendiente)

Pedidos y cuentas de domiciliarios se guardarán en Atlas mediante API
autorizada. El administrador crea pedidos y los asigna únicamente a
domiciliarios activos. Cada domiciliario ve solo sus pedidos asignados;
los cambios de estado requieren autorización y transiciones válidas en
el servidor. No basta ocultar controles en React.

Conservar snapshot y datos existentes; no migrar ni borrar la base actual
automáticamente. Productos demo se mantiene por compatibilidad, pero no
es la prioridad nueva. Estados concretos aún pendientes de especificar.
No guardar datos personales reales en la demo sin seguridad.

## Organización por dominio

Separar cambios de estructura de cambios de autenticación:

```text
frontend/
  src/features/auth/       # siguiente etapa: acceso y sesión
  src/features/products/   # existente: catálogo demo
  src/features/orders/     # futuro: pedidos y asignación
  src/features/couriers/   # futuro: alta por administrador
  src/api/                 # comunicación con Spring Boot
  src/components/          # UI existente; reorganizar en etapa separada
  worker/                  # servidor Cloudflare + pruebas, fuera del bundle
backend/src/main/java/com/bunuelosyanelys/backend/
  auth/                    # siguiente etapa: usuarios y autenticación
  config/                  # configuración transversal
  dashboard/               # existente: snapshot
  health/                  # existente: estado del servicio
  products/                # futura persistencia de productos
  orders/                  # futura persistencia de pedidos/asignación
  couriers/                # futuro: gestión de domiciliarios
```

Las carpetas futuras no se crearon vacías. No regenerar la app, no
reinicializar Git/MongoDB y no mezclar una reorganización masiva con el login.

## Corrección móvil e Inventario retirado — 2026-10-14

- Ya no se monta ni se ofrece Inventario en navegación. Se eliminó su
  módulo demo y sus cinco pruebas específicas porque el usuario retiró
  la funcionalidad, no para evitar fallos. Se añadieron pruebas de ausencia.
- Inicio mantiene pedidos, entregas y ventas demo; no muestra bajo stock
  ni alertas de insumos. Barra inferior: Inicio / Pedidos / Domicilios.
- Error sin instrucciones de ejecutar 127.0.0.1 desde el teléfono; espera
  acotada a 90 segundos y aviso de arranque del servidor. Nunca fallback
  demo silencioso.
- Verificación actual: 73 tests frontend, lint, build y audit sin
  vulnerabilidades conocidas. Chrome focal 320/375/768/1024/1280,
  Escape/foco, preferencia letra32px y zoom CSS200%. No cambios backend/DB.
- Diagnóstico remoto: frontend 200; `/api/health` del dominio frontend
  404 (proxy aún no publicado en esa comprobación); primer health directo
  Render agotó 65s; dashboard posterior 200 con CORS correcto y Atlas.
  Chrome remoto posterior cargó dashboard 200 sin reproducir el error.
  Compatible con arranque lento, no prueba definitiva de la causa de la
  captura. Web remota todavía mostraba Inicio/Ventas/Domicilios/Inventario.

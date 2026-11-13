# Pendientes del frontend

Lista acordada con el usuario (2026-10-16). **No empezar ninguna tarea sin que el usuario lo indique.**
Contexto y reglas: `CLAUDE.md` y `AGENTS.md`. Verificar cada bloque con `npm run lint; npm run test; npm run build`
y Chrome (Playwright `channel: 'chrome'`) a 375 y 1280 px, en tema claro y oscuro.

## 1. Acciones rápidas en pedidos
- [x] Botón **Llamar** (`tel:`) al teléfono del cliente.
- [x] Botón **WhatsApp** (`https://wa.me/57<número>`; normalizar el número a dígitos, prefijo de Colombia).
- [x] Botón **Abrir en Maps** con la dirección (`https://www.google.com/maps/search/?api=1&query=...`).
- [x] Visible para admin y domiciliario (solo en pedidos activos) (el domiciliario solo ve sus pedidos). Objetivos táctiles ≥ 44 px, con `aria-label`.

## 2. Marca en más sitios
- [x] Estados vacíos con el logo (`public/icons/logo.svg`): sin pedidos, sin productos, sin domiciliarios.
- [x] Error del tablero con el logo (la pantalla de carga usa el spinner por decisión del usuario).
- [x] Revisado el contraste del logo `#c37029` en modo oscuro y sobre el encabezado caramelo.

## 3. Pulido de formularios
- [x] Campo **Dirección** a todo el ancho en el formulario de pedidos (hoy queda solo en una columna).
- [x] Aviso de guardado más visible (toast) en vez del texto `role="status"` en línea.
- [x] Estados de carga: spinner en carga inicial, listas, tablero, selector de productos y botones; chulito al entrar y al guardar pedidos, productos y domiciliarios.
- [x] Auditoría de accesibilidad con axe-core (WCAG 2.2 AA): 0 incidencias en login, inicio, pedidos, ventana de pedido, domicilios y perfil, claro y oscuro (390 px).

## 4. Más información en pedidos
- [x] Hora de creación y tiempo transcurrido de cada pedido (hora de Bogotá).
- [x] Búsqueda por cliente/teléfono/dirección y filtro por fecha (Hoy, Ayer, 7 días); refresco automático cada 10 s (solo pedidos; el equipo cada 60 s) (ya existe `FILTERS` en `features/orders/Orders.jsx`).
- [x] Sin cambios de backend salvo que haga falta un campo nuevo.

## 5. Rediseño móvil con forma de app (por fases)
Plan acordado: navegación inferior, un encabezado, botón flotante como acción principal, hojas inferiores
en teléfono, textos cortos. Guía en `AGENTS.md` («Diseño»).
- [x] Fase 1 (commit `74a05e5`, subida a `main` 2026-11-12): encabezado y barra inferior comunes, menú «Más», Modal como hoja en teléfono, Pedidos (tarjetas, detalle y «Filtros»), Inicio. Lint y 114 pruebas en verde; capturas 320/390/768/1280 y oscuro revisadas.
- [x] «Nuevo pedido»: color propio (`--fab-bg`) para que no se confunda con los botones de las tarjetas.
- [ ] Fase 2 (una pantalla por vez, con visto bueno; orden: Domicilios, Productos, Perfil, Configuración, Login; botón flotante en Domicilios y Productos):
  - [x] Domicilios (commit `7b7f2dd`, subido): «Nuevo domiciliario» como botón flotante, crear cuenta y cambiar contraseña en hojas (`Modal`), textos cortos; en Administradores el botón sigue en línea. Lint y pruebas focales en verde; **sin revisar en Chrome** (el usuario eligió no arrancar mock).
  - [x] Productos (hoja para crear/editar y botón flotante). Decisión del usuario: todos los botones de añadir (Pedidos, Domicilios, Productos, Administradores) son solo un «+» grande con `aria-label`, sin texto; el mosaico de pedidos va de a una columna en teléfono. Sin revisar en Chrome.
  - [ ] Perfil.
  - [ ] Configuración.
  - [ ] Login.
  - [ ] Al terminar: revisar las cinco en Chrome a 375 y 1280 px (claro y oscuro), suite completa y actualizar `CLAUDE.md`.
- [ ] Pendiente de verificar: teléfono real, animaciones reducidas, contraste medido, backend real en local (MongoDB detenido).

## 6. Entorno local (pendiente de la sesión)
- [ ] MongoDB (servicio) está **detenido**: `Start-Service MongoDB` exige PowerShell como administrador (lo hace el usuario). No detenerlo ni tocar sus datos.
- [ ] Backend (8080) no arrancado; con Mongo arriba, `.\mvnw.cmd spring-boot:run` con JDK 21 en `backend/`.
- [ ] Vite (5173) puede seguir corriendo de la sesión anterior; cerrarlo por puerto si ya no hace falta. La memoria del equipo estaba muy justa (~690 MB libres).

## 7. Pedidos: tarjetas, detalle y filtros (sin commit)
- [x] Tarjetas con solo cliente, precio, etiquetas de estado y tiempo («hace 25 d») con domiciliario; mismo tamaño que antes.
- [x] Detalle del pedido con texto más grande (total, productos, etiquetas de datos).
- [x] Filtros: se quitan los chips; estado y orden («más recientes/antiguos primero») en el menú de filtros; por defecto «Todos»; separador por día.
- [x] Disponibles (domiciliario) en formato grande; formulario «Nuevo pedido» con títulos de campo y ayudas de 16–18 px.
- [x] Tipografía del resto de la app (preguntas 4 a 12; el usuario pidió subir todo de una vez): texto mínimo 16 px.
  - [x] 4. Lista compacta (tablet/PC): filas y separador por día 15 → 16 px, encabezados 13 → 14 px.
  - [x] 5. Botones secundarios (Cancelar, Editar, Llamar…): 15 → 16 px.
  - [x] 6. Inicio (nombres de tarjetas, «En vivo», días de la gráfica): 15/14 → 16 px.
  - [x] 7. Barra inferior: 14 → 15 px (16 px no cabe: «Domicilios» se partiría a 320 px).
  - [x] 8. Domicilios y Productos (precio, disponibilidad, datos): 14–15 → 16 px.
  - [x] 9. Perfil (nombres de datos y estadísticas): 14 → 16 px.
  - [x] 10. Menú «Más» (usuario bajo el nombre): 15 → 16 px.
  - [x] 11. Login (lema, campos, errores): 15 → 16 px.
  - [x] 12. Avisos, toasts y error de carga: 15 → 16 px.
  - Excepciones a propósito: etiquetas de estado y contador de chips 14 → 15 px; globos de conteo (12–14 px) sin cambio por su círculo fijo.
- [x] Pruebas completas (lint, 116 pruebas, build) en verde; revisado en Chrome: 375 px oscuro (Inicio, Pedidos, Domicilios) y 1280 px claro (lista compacta). Commit `f3ebc8c`.
- [x] Mock de la API en el 8080 cerrado. Vite (5173) sigue corriendo de la sesión.

## Otros pendientes conocidos
- [x] Instalación Android de la PWA: confirmada por el usuario (modo offline en hosting, sin comprobar).
- [ ] Costo de domicilio separado: no acordado, no inventarlo.
- [ ] Cambiar la contraseña del administrador local de pruebas (el usuario dijo que lo hará).
- [ ] Decidir si se retira `VITE_API_BASE_URL` de Cloudflare (ya no lo usa el frontend).

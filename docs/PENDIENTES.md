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

## Otros pendientes conocidos
- [x] Instalación Android de la PWA: confirmada por el usuario (modo offline en hosting, sin comprobar).
- [ ] Costo de domicilio separado: no acordado, no inventarlo.
- [ ] Cambiar la contraseña del administrador local de pruebas (el usuario dijo que lo hará).

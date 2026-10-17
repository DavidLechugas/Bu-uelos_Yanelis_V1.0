# Pendientes del frontend

Lista acordada con el usuario (2026-10-16). **No empezar ninguna tarea sin que el usuario lo indique.**
Contexto y reglas: `CLAUDE.md` y `AGENTS.md`. Verificar cada bloque con `npm run lint; npm run test; npm run build`
y Chrome (Playwright `channel: 'chrome'`) a 375 y 1280 px, en tema claro y oscuro.

## 1. Acciones rápidas en pedidos
- [ ] Botón **Llamar** (`tel:`) al teléfono del cliente.
- [ ] Botón **WhatsApp** (`https://wa.me/57<número>`; normalizar el número a dígitos, prefijo de Colombia).
- [ ] Botón **Abrir en Maps** con la dirección (`https://www.google.com/maps/search/?api=1&query=...`).
- [ ] Visible para admin y domiciliario (el domiciliario solo ve sus pedidos). Objetivos táctiles ≥ 44 px, con `aria-label`.

## 2. Marca en más sitios
- [ ] Estados vacíos con el logo (`public/icons/logo.svg`): sin pedidos, sin productos, sin domiciliarios.
- [ ] Pantalla de carga y de error del tablero con el logo.
- [ ] Revisar el contraste del logo `#c37029` en modo oscuro y sobre el encabezado caramelo.

## 3. Pulido de formularios
- [ ] Campo **Dirección** a todo el ancho en el formulario de pedidos (hoy queda solo en una columna).
- [ ] Aviso de guardado más visible (toast) en vez del texto `role="status"` en línea.
- [ ] Estados de carga tipo esqueleto en lugar de «Cargando…».
- [ ] Mantener la accesibilidad: foco, `aria-live`, `prefers-reduced-motion`.

## 4. Más información en pedidos
- [ ] Hora de creación y tiempo transcurrido de cada pedido (hora de Bogotá).
- [ ] Búsqueda por cliente y filtros por estado/fecha (ya existe `FILTERS` en `features/orders/Orders.jsx`).
- [ ] Sin cambios de backend salvo que haga falta un campo nuevo.

## Otros pendientes conocidos
- [ ] Validar instalación Android de la PWA y modo offline en hosting (sin comprobar).
- [ ] Costo de domicilio separado: no acordado, no inventarlo.
- [ ] Cambiar la contraseña del administrador local de pruebas (el usuario dijo que lo hará).

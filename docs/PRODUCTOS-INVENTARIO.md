# Productos e Inventario — primera etapa de vistas

> **Documento histórico.** El usuario retiró Inventario del alcance el
> 2026-10-14; ya no existe su vista ni navegación. Nueva prioridad:
> administrador crea domiciliarios y gestiona/asigna pedidos. Ver `AUTH.md`.
> Productos demo permanece; no se borraron datos de Atlas.

Implementación local del 2026-10-14, basada en los tableros actuales de
Penpot `02 — Pantallas` (no los tableros archivados). Penpot se consultó
en modo lectura; no se alteraron diseños ni se crearon pantallas allí.

## Alcance y navegación

- **Productos**: menú lateral → Productos. Catálogo de venta con búsqueda,
  precios COP, disponibilidad y formularios inline para agregar/editar.
- **Inventario**: barra inferior → Inventario. Ingredientes e insumos,
  búsqueda, filtro de bajo stock y movimientos manuales de entrada/salida.
- **Inicio** regresa al tablero leído de la API existente.
- Las demás vistas siguen avisando que no están implementadas.

Los tres productos y cuatro insumos iniciales siguen los nombres,
descripciones, precios y cantidades de Penpot. Las métricas de inventario
se calculan con los cuatro insumos, no con los números decorativos 18/3
del boceto. Formularios y búsqueda completan interacciones que no estaban
dibujadas, con los tokens y controles de la interfaz existente.

## Demostración, no persistencia real

El estado de cada módulo permanece al navegar entre vistas, pero se pierde
al recargar o cerrar sesión. Se muestra un aviso explícito. No se usa
localStorage, no se escriben datos en Atlas y no existen APIs de escritura.
Los movimientos no actualizan el snapshot del tablero ni descuentan recetas.
Los roles del login siguen siendo simulados, no controles de autorización.

Próxima etapa para datos reales: definir contratos del dominio, implementar
autenticación/autorización y persistencia antes de exponer escrituras públicas.
No confundir productos vendibles con materias primas y suministros.

## Reglas de formularios

- Producto: nombre obligatorio (máximo 100 caracteres), descripción opcional
  (máximo 240), precio COP entero positivo seguro, disponibilidad explícita.
- Movimiento: cantidad positiva con hasta tres decimales (separador `.`),
  motivo obligatorio (máximo 240). La salida no supera stock disponible.
- Stock calculado en milésimas enteras para evitar errores acumulados de
  coma flotante. Validación adicional del límite entero seguro.
- Cancelar no modifica datos. Formulario enfoca su primer control; al cerrar,
  restaura foco al botón o a búsqueda si una fila deja de existir en el filtro.

## Organización y verificación

- `frontend/src/features/products/`: vista y pruebas de catálogo.
- `frontend/src/features/inventory/`: vista y pruebas de movimientos.
- `ManagementField.jsx` y `management.css`: controles y estilos comunes.
- `App.jsx`: navegación, conservación de estado de sesión y cierre.

Verificación 2026-10-14: frontend lint, 49 tests y build PWA aprobados;
backend sin modificaciones, 23 tests aprobados. Chrome + Playwright focal
en 320/375/768/1024/1280, creación, movimientos, navegación y drawer Escape,
preferencia de letra 32px y zoom CSS 200%. El dashboard se simuló en el
navegador para aislar esta prueba del servidor; no equivale a validar
estas vistas desplegadas. Scripts y capturas de verificación solo en Temp.

No se agregaron dependencias ni se reemplazaron los emojis de navegación.
Los intentos de subagentes fallaron por modelos configurados no disponibles;
se implementó directamente conservando la separación de módulos.

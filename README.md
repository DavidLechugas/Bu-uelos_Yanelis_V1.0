# Buñuelos Yanelys

App interna para gestionar pedidos y entregas de Buñuelos Yanelys. La usan el
**administrador** (tablero, pedidos, domiciliarios, productos) y los **domiciliarios**
(solo sus pedidos). No hay clientes ni registro público.

- Web (PWA instalable): https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev
- API: https://bu-uelos-yanelis-v1-0.onrender.com

## Funciones

- Login real con sesión en cookie HttpOnly, CSRF y bloqueo tras 5 intentos fallidos.
- Pedidos: crear, editar, asignar, avanzar (Pendiente → Asignado → En camino → Entregado) y cancelar.
- Domiciliarios: el administrador los crea, activa/desactiva y restablece su contraseña.
- Tablero en vivo calculado desde los pedidos (se actualiza cada 15 s).
- Productos guardados en MongoDB, perfil propio (nombre, foto, contraseña) y modo oscuro.

## Stack

- `frontend/`: Vite 7 + React 19, PWA. Cloudflare Workers sirve la interfaz y reenvía `/api` a Render.
- `backend/`: Spring Boot 4, Java 21, MongoDB (Atlas en producción, local en desarrollo).

## Desarrollo (Windows)

Requisitos: Node 24, JDK 21 (`C:\Program Files\Java\jdk-21.0.12.1`; el PATH trae Java 26) y MongoDB local en 127.0.0.1:27017.

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'
.\mvnw.cmd test            # pruebas contra bases locales de prueba
.\mvnw.cmd spring-boot:run # 127.0.0.1:8080

cd frontend
npm run lint; npm run test; npm run build
npm run dev                # :5173, proxy /api -> 127.0.0.1:8080
```

## Documentación

- `CLAUDE.md` y `AGENTS.md`: contexto, estado y reglas para agentes.
- `docs/AUTH.md`: diseño de la autenticación.
- `docs/DEPLOY.md`: despliegue en Cloudflare, Render y Atlas.
- `docs/HISTORIAL.md`: archivo de notas antiguas.

Las credenciales viven solo en los paneles de Render y Atlas, nunca en el repositorio.

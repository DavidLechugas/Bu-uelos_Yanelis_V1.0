const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Lee el snapshot del tablero desde la API local (Spring Boot).
 * En desarrollo la ruta /api se proxyfica a http://127.0.0.1:8080.
 *
 * cache: 'no-store': la respuesta de la API nunca se guarda en
 * la caché HTTP del navegador (hoy son datos de demostración;
 * mañana serán datos personales). El service worker además
 * aplica NetworkOnly a /api: doble garantía de no caché.
 */
export async function fetchDashboard() {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/dashboard`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(90000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Espera un momento y pulsa Reintentar.');
    }
    throw new Error('No se pudo conectar con el servidor. Comprueba tu conexión y pulsa Reintentar.');
  }
  if (!response.ok) {
    throw new Error(`No se pudieron cargar los datos (HTTP ${response.status}).`);
  }
  return response.json();
}

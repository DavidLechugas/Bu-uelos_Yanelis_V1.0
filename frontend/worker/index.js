// Código de servidor Cloudflare: no se incluye en el bundle React.
// Solo este backend está permitido; la petición nunca decide el destino.
const BACKEND_ORIGIN = 'https://bu-uelos-yanelis-v1-0.onrender.com';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const METHODS = new Set([...SAFE_METHODS, 'POST', 'PUT', 'PATCH', 'DELETE']);
const REQUEST_HEADERS = [
  'accept', 'content-type', 'cookie', 'origin', 'user-agent',
  'x-csrf-token', 'x-xsrf-token',
];

function errorResponse(status, message) {
  return Response.json({ message }, {
    status,
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    if (env.API_ORIGIN !== BACKEND_ORIGIN) {
      return errorResponse(503, 'Servicio no configurado.');
    }
    if (!METHODS.has(request.method)) {
      return errorResponse(405, 'Método no permitido.');
    }

    const origin = request.headers.get('origin');
    if ((origin && origin !== url.origin) || (!SAFE_METHODS.has(request.method) && origin !== url.origin)) {
      return errorResponse(403, 'Origen no permitido.');
    }

    // Allowlist: no confiar en Forwarded, X-Forwarded-*, X-Admin ni
    // otras cabeceras de identidad suministradas por el navegador.
    const headers = new Headers();
    for (const name of REQUEST_HEADERS) {
      if (request.headers.has(name)) headers.set(name, request.headers.get(name));
    }
    headers.set('cache-control', 'no-store');
    const target = `${BACKEND_ORIGIN}${url.pathname}${url.search}`;
    const upstream = new Request(target, {
      method: request.method,
      headers,
      body: request.body,
      duplex: 'half',
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    });

    try {
      const response = await fetch(upstream, { cf: { cacheTtl: 0, cacheEverything: false } });
      // Una API JSON no debe redirigir a páginas de login ni a otro
      // dominio. No reenviar cookies/cuerpos a destinos de Location.
      if (response.status >= 300 && response.status < 400) {
        return errorResponse(502, 'Respuesta inesperada del servicio.');
      }
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('cache-control', 'no-store');
      responseHeaders.set('x-content-type-options', 'nosniff');
      // La API es same-origin: no publicar permisos CORS del upstream.
      for (const name of [...responseHeaders.keys()]) {
        if (name.startsWith('access-control-')) responseHeaders.delete(name);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch {
      // Nunca registrar cuerpo de login, cookies ni errores con secretos.
      return errorResponse(502, 'No se pudo contactar con el servicio.');
    }
  },
};

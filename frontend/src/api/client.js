/**
 * Cliente HTTP de la API (Spring Boot).
 *
 * Siempre MISMO ORIGEN (/api): en desarrollo Vite lo proxyfica a
 * 127.0.0.1:8080 y en hosting el Worker de Cloudflare lo reenvía a
 * Render. Así la cookie de sesión (HttpOnly) es de primera parte y
 * funciona en móviles sin cookies de terceros. VITE_API_BASE_URL ya
 * no se usa.
 *
 * cache: 'no-store': las respuestas nunca se guardan en la caché HTTP
 * (son datos personales). El service worker además aplica NetworkOnly.
 */

export const SESSION_EXPIRED_EVENT = 'by:session-expired';

const TIMEOUT_MS = 90000;
const SAFE_METHODS = new Set(['GET', 'HEAD']);

export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

/** Token CSRF de la cookie XSRF-TOKEN (patrón double-submit de Spring Security). */
function csrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = 'GET', body, notifyExpired = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!SAFE_METHODS.has(method)) {
    const token = csrfToken();
    if (token) headers['X-XSRF-TOKEN'] = token;
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Espera un momento y pulsa Reintentar.');
    }
    throw new ApiError('No se pudo conectar con el servidor. Comprueba tu conexión y pulsa Reintentar.');
  }

  if (response.status === 204) return null;
  const data = await readJson(response);
  if (!response.ok) {
    if (response.status === 401 && notifyExpired) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(
      data?.error ?? `No se pudieron cargar los datos (HTTP ${response.status}).`,
      response.status,
      data?.campos ?? {},
    );
  }
  return data;
}

export const fetchDashboard = () => apiRequest('/api/dashboard');

export const auth = {
  session: () => apiRequest('/api/auth/session', { notifyExpired: false }),
  login: async (usuario, password) => {
    // Sin cookie CSRF (p. ej. la primera consulta falló), pedirla antes.
    if (!csrfToken()) await apiRequest('/api/auth/session', { notifyExpired: false });
    return apiRequest('/api/auth/login', { method: 'POST', body: { usuario, password }, notifyExpired: false });
  },
  logout: () => apiRequest('/api/auth/logout', { method: 'POST', notifyExpired: false }),
  updateProfile: (profile) => apiRequest('/api/auth/profile', { method: 'PUT', body: profile }),
  changePassword: (actual, nueva) =>
    apiRequest('/api/auth/password', { method: 'PUT', body: { actual, nueva } }),
};

export const ordersApi = {
  list: () => apiRequest('/api/orders'),
  create: (order) => apiRequest('/api/orders', { method: 'POST', body: order }),
  update: (id, order) => apiRequest(`/api/orders/${encodeURIComponent(id)}`, { method: 'PUT', body: order }),
  claim: (id) => apiRequest(`/api/orders/${encodeURIComponent(id)}/tomar`, { method: 'POST' }),
  assign: (id, domiciliarioId) =>
    apiRequest(`/api/orders/${encodeURIComponent(id)}/domiciliario`, { method: 'PUT', body: { domiciliarioId } }),
  setStatus: (id, estado) =>
    apiRequest(`/api/orders/${encodeURIComponent(id)}/estado`, { method: 'PATCH', body: { estado } }),
};

export const couriersApi = {
  list: () => apiRequest('/api/couriers'),
  create: (courier) => apiRequest('/api/couriers', { method: 'POST', body: courier }),
  setActive: (id, activo) =>
    apiRequest(`/api/couriers/${encodeURIComponent(id)}/activo`, { method: 'PATCH', body: { activo } }),
  resetPassword: (id, password) =>
    apiRequest(`/api/couriers/${encodeURIComponent(id)}/password`, { method: 'PUT', body: { password } }),
};

export const productsApi = {
  list: () => apiRequest('/api/products'),
  create: (product) => apiRequest('/api/products', { method: 'POST', body: product }),
  update: (id, product) => apiRequest(`/api/products/${encodeURIComponent(id)}`, { method: 'PUT', body: product }),
};

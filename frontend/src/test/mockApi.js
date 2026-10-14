import { vi } from 'vitest';

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('sin cuerpo');
      return body;
    },
  };
}

/**
 * Sustituye fetch por un enrutador simple: claves «MÉTODO /ruta» con
 * `{ status, body }` o una función que recibe la llamada y lo devuelve.
 * Registra cada llamada (método, ruta, cuerpo JSON y cabeceras).
 */
export function mockApi(routes) {
  const calls = [];
  const fetch = vi.fn(async (path, init = {}) => {
    const call = {
      method: init.method ?? 'GET',
      path,
      headers: init.headers ?? {},
      body: init.body ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const handler = routes[`${call.method} ${path}`];
    if (!handler) return response(404, { error: `Ruta no simulada: ${call.method} ${path}` });
    const result = typeof handler === 'function' ? await handler(call) : handler;
    return response(result.status ?? 200, result.body);
  });
  vi.stubGlobal('fetch', fetch);
  return { fetch, calls };
}

export const ADMIN = { id: 'u-admin', usuario: 'yanelys', nombre: 'Yanelys', role: 'ADMIN' };
export const COURIER = { id: 'u-luis', usuario: 'luis', nombre: 'Luis', role: 'COURIER' };

export function order(overrides = {}) {
  return {
    id: 'o-1',
    cliente: 'Carmen',
    telefono: '300 123 4567',
    direccion: 'Cra 5 #10-20',
    detalle: '12 buñuelos',
    totalCop: 24000,
    estado: 'PENDIENTE',
    domiciliarioId: null,
    domiciliarioNombre: null,
    creadoEn: '2026-10-14T15:00:00Z',
    actualizadoEn: '2026-10-14T15:00:00Z',
    ...overrides,
  };
}

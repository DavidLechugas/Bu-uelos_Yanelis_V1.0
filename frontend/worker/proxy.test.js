// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index.js';

const origin = 'https://app.example.workers.dev';
const backend = 'https://bu-uelos-yanelis-v1-0.onrender.com';
const environment = () => ({
  API_ORIGIN: backend,
  ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('interfaz')) },
});

afterEach(() => vi.unstubAllGlobals());

describe('Worker: API bajo el mismo origen', () => {
  it('sirve la interfaz por ASSETS y no llama al backend', async () => {
    const env = environment();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const request = new Request(`${origin}/productos`);
    expect(await (await worker.fetch(request, env)).text()).toBe('interfaz');
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('proxyfica solo /api, conserva ruta/query y nunca usa un destino del cliente', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 'UP' }));
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api/health?url=https://evil.example`), environment());
    const forwarded = fetch.mock.calls[0][0];
    expect(forwarded.url).toBe(`${backend}/api/health?url=https://evil.example`);
    expect(forwarded.redirect).toBe('manual');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.json()).toEqual({ status: 'UP' });
  });

  it('envía cuerpo, cookie y CSRF; elimina cabeceras de proxy falsificadas', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ usuario: 'Ana' }));
    vi.stubGlobal('fetch', fetch);
    const request = new Request(`${origin}/api/auth/login`, {
      method: 'POST', body: JSON.stringify({ usuario: 'Ana', password: 'valor-de-prueba' }),
      headers: { origin, 'content-type': 'application/json', cookie: 'BY_SESSION=opaque',
        'x-xsrf-token': 'csrf-test', forwarded: 'for=attacker', 'x-forwarded-host': 'evil.example',
        'x-forwarded-for': '127.0.0.1', 'x-forwarded-proto': 'http', 'x-admin': 'true' },
    });
    await worker.fetch(request, environment());
    const forwarded = fetch.mock.calls[0][0];
    expect(forwarded.method).toBe('POST');
    expect(await forwarded.json()).toEqual({ usuario: 'Ana', password: 'valor-de-prueba' });
    expect(forwarded.headers.get('origin')).toBe(origin);
    expect(forwarded.headers.get('cookie')).toBe('BY_SESSION=opaque');
    expect(forwarded.headers.get('x-xsrf-token')).toBe('csrf-test');
    for (const name of ['forwarded', 'x-forwarded-host', 'x-forwarded-for', 'x-forwarded-proto', 'x-admin']) {
      expect(forwarded.headers.has(name)).toBe(false);
    }
  });

  it('conserva las cookies de respuesta separadas y los errores de autorización', async () => {
    const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' });
    headers.append('set-cookie', 'BY_SESSION=opaque; Path=/; HttpOnly; Secure; SameSite=Lax');
    headers.append('set-cookie', 'XSRF-TOKEN=csrf-test; Path=/; Secure; SameSite=Lax');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401, headers })));
    const response = await worker.fetch(new Request(`${origin}/api/auth/me`), environment());
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toHaveLength(2);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each(['', 'http://localhost:8080', 'https://evil.example', `${backend}/api`, `${backend}/`, `${backend}?a=1`, `https://user:pass@bu-uelos-yanelis-v1-0.onrender.com`])('rechaza origen backend inválido %s', async API_ORIGIN => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api/health`), { ...environment(), API_ORIGIN });
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rechaza %s sin origen del frontend', async method => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api/products`, { method }), environment());
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rechaza solicitudes con origen externo incluso en lecturas', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api/auth/me`, { headers: { origin: 'https://evil.example' } }), environment());
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([301, 302, 307, 308])('no sigue redirecciones %s ni devuelve destinos externos', async status => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status, headers: { location: 'https://evil.example' } }));
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api/auth/me`), environment());
    expect(response.status).toBe(502);
    expect(response.headers.has('location')).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('devuelve error genérico cuando Render falla, sin filtrar detalles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('detalle interno reservado')));
    const response = await worker.fetch(new Request(`${origin}/api/dashboard`), environment());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('detalle interno');
  });

  it('no envía /apiculture al backend', async () => {
    const env = environment();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await worker.fetch(new Request(`${origin}/apiculture`), env);
    expect(fetch).not.toHaveBeenCalled();
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
  });

  it('encamina /api exacto al backend y preserva respuestas sin cuerpo', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api`, { method: 'HEAD' }), environment());
    expect(fetch.mock.calls[0][0].url).toBe(`${backend}/api`);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('elimina permisos CORS del backend en la respuesta same-origin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', {
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-credentials': 'true' },
    })));
    const response = await worker.fetch(new Request(`${origin}/api/health`), environment());
    expect(response.headers.has('access-control-allow-origin')).toBe(false);
    expect(response.headers.has('access-control-allow-credentials')).toBe(false);
  });

  it('rechaza métodos fuera del contrato', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await worker.fetch(new Request(`${origin}/api/health`, { method: 'PROPFIND' }), environment());
    expect(response.status).toBe(405);
    expect(fetch).not.toHaveBeenCalled();
  });
});

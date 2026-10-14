import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDashboard } from './client.js';

afterEach(() => vi.unstubAllGlobals());

describe('API dashboard', () => {
  it('lee datos reales sin caché con tiempo limitado para el arranque remoto', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ pedidos: 36 }) });
    vi.stubGlobal('fetch', fetch);
    expect(await fetchDashboard()).toEqual({ pedidos: 36 });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/dashboard'), expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }));
  });

  it('explica un fallo de conexión sin indicar que hay que usar localhost', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchDashboard()).rejects.toThrow('No se pudo conectar con el servidor');
  });

  it('explica un timeout sin mantener una carga indefinida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')));
    await expect(fetchDashboard()).rejects.toThrow('El servidor tardó demasiado');
  });

  it('preserva el estado HTTP para diagnosticar errores del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchDashboard()).rejects.toThrow('HTTP 503');
  });
});

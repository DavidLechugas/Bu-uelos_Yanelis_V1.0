import { describe, expect, it } from 'vitest';
import { dayStats } from './ProfilePanel.jsx';

describe('dayStats', () => {
  it('cuenta solo lo entregado hoy y lo que falta por entregar', () => {
    const now = new Date().toISOString();
    const ayer = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const stats = dayStats([
      { estado: 'ENTREGADO', totalCop: 10000, actualizadoEn: now },
      { estado: 'ENTREGADO', totalCop: 5000, actualizadoEn: now },
      { estado: 'ENTREGADO', totalCop: 9000, actualizadoEn: ayer },
      { estado: 'EN_CAMINO', totalCop: 7000, actualizadoEn: now },
      { estado: 'CANCELADO', totalCop: 3000, actualizadoEn: now },
    ]);
    expect(stats).toEqual({ entregados: 2, total: 15000, porEntregar: 1 });
  });
});

import { describe, expect, it } from 'vitest';
import { matchesDate, matchesSearch, timeAgo } from './orderTime.js';

// 2026-10-17 15:00 en Bogotá (UTC-5) = 20:00 UTC
const NOW = Date.parse('2026-10-17T20:00:00Z');
const at = (iso) => ({ creadoEn: iso });

describe('timeAgo', () => {
  it('usa minutos, horas y días', () => {
    expect(timeAgo('2026-10-17T19:59:40Z', NOW)).toBe('hace menos de 1 min');
    expect(timeAgo('2026-10-17T19:48:00Z', NOW)).toBe('hace 12 min');
    expect(timeAgo('2026-10-17T16:50:00Z', NOW)).toBe('hace 3 h');
    expect(timeAgo('2026-10-14T20:00:00Z', NOW)).toBe('hace 3 d');
  });
});

describe('matchesDate', () => {
  it('compara por día de Bogotá, no por UTC', () => {
    // 03:00 UTC del 18 sigue siendo el 17 en Bogotá.
    expect(matchesDate(at('2026-10-18T03:00:00Z'), 'hoy', NOW)).toBe(true);
    expect(matchesDate(at('2026-10-16T20:00:00Z'), 'hoy', NOW)).toBe(false);
    expect(matchesDate(at('2026-10-16T20:00:00Z'), 'ayer', NOW)).toBe(true);
    expect(matchesDate(at('2026-10-11T20:00:00Z'), 'semana', NOW)).toBe(true);
    expect(matchesDate(at('2026-10-10T20:00:00Z'), 'semana', NOW)).toBe(false);
    expect(matchesDate(at('2020-01-01T00:00:00Z'), 'todas', NOW)).toBe(true);
  });
});

describe('matchesSearch', () => {
  const order = { cliente: 'José Pérez', direccion: 'Cra 5 #10-20', telefono: '300 123 4567' };
  it('busca por cliente, dirección o teléfono sin tildes ni mayúsculas', () => {
    expect(matchesSearch(order, 'jose')).toBe(true);
    expect(matchesSearch(order, 'CRA 5')).toBe(true);
    expect(matchesSearch(order, '3001234')).toBe(true);
    expect(matchesSearch(order, '300-123')).toBe(true);
    expect(matchesSearch(order, 'maria')).toBe(false);
    expect(matchesSearch(order, '   ')).toBe(true);
  });
});

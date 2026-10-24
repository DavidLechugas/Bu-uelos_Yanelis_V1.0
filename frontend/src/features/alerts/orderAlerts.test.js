import { describe, expect, it } from 'vitest';
import { detectAlerts, summarize } from './orderAlerts.js';

const COURIER = { id: 'u-luis', role: 'COURIER' };
const ADMIN = { id: 'u-admin', role: 'ADMIN' };
const base = { tipo: 'DOMICILIO', estado: 'PENDIENTE', domiciliarioId: null, domiciliarioNombre: null };
const order = (id, overrides = {}) => ({ ...base, id, ...overrides });

describe('detectAlerts', () => {
  it('no avisa con la primera lista', () => {
    expect(detectAlerts(null, [order('1')], COURIER)).toEqual([]);
  });

  it('avisa al domiciliario de un pedido disponible nuevo y de uno que le asignan', () => {
    const before = [order('1')];
    const next = [order('1'), order('2'), order('3', { estado: 'ASIGNADO', domiciliarioId: 'u-luis' })];
    expect(detectAlerts(before, next, COURIER)).toEqual(['Hay un pedido nuevo disponible.', 'Te asignaron un pedido.']);
  });

  it('no avisa al domiciliario cuando él mismo toma un pedido disponible', () => {
    const before = [order('1')];
    const next = [order('1', { estado: 'ASIGNADO', domiciliarioId: 'u-luis' })];
    expect(detectAlerts(before, next, COURIER)).toEqual([]);
  });

  it('avisa al domiciliario de una cancelación y no de las ventas en local', () => {
    const before = [order('1', { estado: 'ASIGNADO', domiciliarioId: 'u-luis' })];
    const next = [order('1', { estado: 'CANCELADO', domiciliarioId: 'u-luis' }), order('2', { tipo: 'LOCAL', estado: 'ENTREGADO' })];
    expect(detectAlerts(before, next, COURIER)).toEqual(['Cancelaron uno de tus pedidos.']);
  });

  it('avisa al administrador de pedidos nuevos y del avance de las entregas', () => {
    const before = [order('1', { estado: 'ASIGNADO', domiciliarioId: 'u-luis', domiciliarioNombre: 'Luis' })];
    const next = [
      order('1', { estado: 'EN_CAMINO', domiciliarioId: 'u-luis', domiciliarioNombre: 'Luis' }),
      order('2'),
      order('3', { tipo: 'LOCAL', estado: 'ENTREGADO' }),
    ];
    expect(detectAlerts(before, next, ADMIN)).toEqual(['Luis salió con un pedido.', 'Entró un pedido nuevo.']);
  });

  it('resume varios avisos en uno', () => {
    expect(summarize(['a'])).toBe('a');
    expect(summarize(['a', 'b', 'c'])).toBe('3 novedades en los pedidos.');
  });
});

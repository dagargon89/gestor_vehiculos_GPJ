import { describe, it, expect } from 'vitest';
import { validateReservationDates } from './reservationDates';

describe('validateReservationDates', () => {
  it('rechaza fechas inválidas', () => {
    expect(validateReservationDates('no-es-fecha', '2026-08-01T10:00')).toMatch(/no son válidas/);
  });

  it('rechaza años fuera de rango', () => {
    expect(validateReservationDates('2010-01-01T10:00', '2010-01-01T12:00')).toMatch(/año debe estar entre/);
  });

  it('rechaza regreso anterior o igual a salida', () => {
    expect(validateReservationDates('2026-08-01T12:00', '2026-08-01T10:00')).toMatch(/posterior a la hora de salida/);
    expect(validateReservationDates('2026-08-01T12:00', '2026-08-01T12:00')).toMatch(/posterior a la hora de salida/);
  });

  it('rechaza fechas en el pasado salvo que allowPast sea true', () => {
    expect(validateReservationDates('2020-01-01T10:00', '2020-01-01T12:00')).toMatch(/no puede estar en el pasado|año debe estar entre/);
    expect(validateReservationDates('2020-01-01T10:00', '2020-01-01T12:00', { allowPast: true })).toMatch(/año debe estar entre/);
  });

  it('acepta un rango válido', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const start = future.toISOString().slice(0, 16);
    const end = new Date(future.getTime() + 3600000).toISOString().slice(0, 16);
    expect(validateReservationDates(start, end)).toBeNull();
  });
});

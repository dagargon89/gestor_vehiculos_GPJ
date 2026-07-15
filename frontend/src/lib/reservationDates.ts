export function validateReservationDates(
  startDatetime: string,
  endDatetime: string,
  opts: { allowPast?: boolean } = {},
): string | null {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Las fechas no son válidas. Revisa hora de salida y de regreso.';
  }
  const yearMin = 2020;
  const yearMax = 2035;
  if (
    start.getFullYear() < yearMin ||
    start.getFullYear() > yearMax ||
    end.getFullYear() < yearMin ||
    end.getFullYear() > yearMax
  ) {
    return `El año debe estar entre ${yearMin} y ${yearMax}. Revisa las fechas.`;
  }
  if (!opts.allowPast && start.getTime() < Date.now() - 5 * 60 * 1000) {
    return 'La fecha de salida no puede estar en el pasado.';
  }
  if (end.getTime() <= start.getTime()) {
    return 'La hora de regreso debe ser posterior a la hora de salida.';
  }
  return null;
}

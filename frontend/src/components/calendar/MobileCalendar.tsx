import { useState, useMemo } from 'react';
import { getVehicleColor, getVehicleColorPending } from '../../utils/vehicleColors';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

export type MobileCalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  vehicleId?: string;
  description?: string;
  destination?: string;
  reservedBy?: string;
  vehiclePlate?: string;
};

type MobileCalendarProps = {
  events: MobileCalEvent[];
  currentDate: Date;
  onNavigate?: (date: Date) => void;
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  selectable?: boolean;
};

const WEEK_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function MobileCalendar({
  events,
  currentDate,
  onNavigate,
  onSelectSlot,
  selectable = false,
}: MobileCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const days: Date[] = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const result: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      result.push(d);
      d = addDays(d, 1);
    }
    return result;
  }, [currentDate]);

  const eventsForDay = (d: Date) => {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    return events.filter((e) => e.end >= dayStart && e.start <= dayEnd);
  };

  const dayEvents = eventsForDay(selectedDate);

  const vehicleLegend = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of events) {
      const vid = e.vehicleId ?? e.id;
      if (e.vehiclePlate && !seen.has(vid)) seen.set(vid, e.vehiclePlate);
    }
    return Array.from(seen.entries()).map(([vehicleId, plate]) => ({ vehicleId, plate }));
  }, [events]);

  const handleDayClick = (d: Date) => {
    setSelectedDate(d);
    if (selectable && onSelectSlot) {
      const start = new Date(d);
      start.setHours(8, 0, 0, 0);
      const end = new Date(d);
      end.setHours(9, 0, 0, 0);
      onSelectSlot({ start, end });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate?.(subMonths(currentDate, 1))}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Mes anterior"
        >
          <span className="material-icons">chevron_left</span>
        </button>
        <span className="text-base font-bold capitalize" style={{ color: 'var(--color-text)' }}>
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => onNavigate?.(addMonths(currentDate, 1))}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Mes siguiente"
        >
          <span className="material-icons">chevron_right</span>
        </button>
      </div>

      {/* Encabezados de días */}
      <div className="grid grid-cols-7 text-center">
        {WEEK_HEADERS.map((wd) => (
          <div key={wd} className="text-xs font-semibold py-1" style={{ color: 'var(--color-text-muted)' }}>
            {wd}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d, i) => {
          const dayEvts = eventsForDay(d);
          const inMonth = isSameMonth(d, currentDate);
          const selected = isSameDay(d, selectedDate);
          const today = isToday(d);
          // Up to 3 unique vehicle dots
          const dotVehicles = Array.from(
            new Map(dayEvts.map(e => [e.vehicleId ?? e.id, e])).values()
          ).slice(0, 3);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(d)}
              className="flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors"
              style={
                selected
                  ? { background: 'linear-gradient(135deg,#6384ff,#5a6fff)', color: '#fff' }
                  : today
                  ? { outline: '2px solid #6384ff', outlineOffset: '-2px' }
                  : {}
              }
              onMouseEnter={e => {
                if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(99,132,255,0.08)';
              }}
              onMouseLeave={e => {
                if (!selected) (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <span
                className="text-sm font-medium leading-none"
                style={{
                  color: selected
                    ? '#fff'
                    : inMonth
                    ? 'var(--color-text)'
                    : 'var(--color-text-muted)',
                  opacity: inMonth ? 1 : 0.4,
                }}
              >
                {format(d, 'd')}
              </span>
              <div className="flex gap-0.5 mt-1 h-1.5">
                {dotVehicles.map(e => {
                  const vid = e.vehicleId ?? e.id;
                  const dotColor = selected ? '#fff' : getVehicleColor(vid).bg;
                  return (
                    <span
                      key={vid}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: dotColor }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leyenda — vehículos presentes en el mes */}
      {vehicleLegend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
          {vehicleLegend.map(({ vehicleId, plate }) => {
            const c = getVehicleColor(vehicleId);
            return (
              <span key={vehicleId} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.bg }} />
                {plate}
              </span>
            );
          })}
        </div>
      )}

      {/* Eventos del día seleccionado */}
      <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-sm font-semibold mb-2 capitalize px-1" style={{ color: 'var(--color-text-soft)' }}>
          {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {dayEvents.length === 0 ? (
          <p className="text-center py-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {selectable ? 'Día disponible. Toca para seleccionar.' : 'Sin reservas este día.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map((e) => {
              const vid = e.vehicleId ?? e.id;
              const isPending = e.status === 'pending';
              const c = isPending ? getVehicleColorPending(vid) : getVehicleColor(vid);
              const r = parseInt(getVehicleColor(vid).bg.slice(1, 3), 16);
              const g = parseInt(getVehicleColor(vid).bg.slice(3, 5), 16);
              const b = parseInt(getVehicleColor(vid).bg.slice(5, 7), 16);
              return (
                <div
                  key={e.id}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    background: `rgba(${r},${g},${b},0.10)`,
                    borderLeft: `4px solid ${c.border}`,
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{e.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {format(e.start, 'HH:mm')} – {format(e.end, 'HH:mm')}
                    {e.vehiclePlate && ` · ${e.vehiclePlate}`}
                  </p>
                  {e.reservedBy && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{e.reservedBy}</p>
                  )}
                  {(e.destination || e.description) && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                      {e.destination || e.description}
                    </p>
                  )}
                  <span
                    className="inline-block text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-full"
                    style={{
                      background: `rgba(${r},${g},${b},0.18)`,
                      color: c.bg,
                    }}
                  >
                    {isPending ? 'Pendiente' : 'Activa'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

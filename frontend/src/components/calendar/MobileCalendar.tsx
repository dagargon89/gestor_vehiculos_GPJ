import { useState, useMemo } from 'react';
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
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Mes anterior"
        >
          <span className="material-icons text-slate-600">chevron_left</span>
        </button>
        <span className="text-base font-bold text-slate-900 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => onNavigate?.(addMonths(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Mes siguiente"
        >
          <span className="material-icons text-slate-600">chevron_right</span>
        </button>
      </div>

      {/* Encabezados de días */}
      <div className="grid grid-cols-7 text-center">
        {WEEK_HEADERS.map((wd) => (
          <div key={wd} className="text-xs font-semibold text-slate-400 py-1">
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
          const hasPending = dayEvts.some((e) => e.status === 'pending');
          const hasActive = dayEvts.some((e) => e.status === 'active');

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(d)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
                selected
                  ? 'bg-primary text-white'
                  : today
                  ? 'ring-2 ring-primary ring-inset'
                  : inMonth
                  ? 'hover:bg-slate-100'
                  : ''
              }`}
            >
              <span
                className={`text-sm font-medium leading-none ${
                  inMonth
                    ? selected
                      ? 'text-white'
                      : 'text-slate-800'
                    : 'text-slate-300'
                }`}
              >
                {format(d, 'd')}
              </span>
              <div className="flex gap-0.5 mt-1 h-1.5">
                {hasPending && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-amber-400'}`}
                  />
                )}
                {hasActive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-red-500'}`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 px-1">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" /> Pendiente
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" /> Activa
        </span>
      </div>

      {/* Eventos del día seleccionado */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-700 mb-2 capitalize px-1">
          {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {dayEvents.length === 0 ? (
          <p className="text-center py-5 text-slate-400 text-sm">
            {selectable ? 'Día disponible. Toca para seleccionar.' : 'Sin reservas este día.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map((e) => (
              <div
                key={e.id}
                className={`rounded-lg px-3 py-2.5 border-l-4 ${
                  e.status === 'pending'
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <p className="text-sm font-medium text-slate-900 truncate">{e.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {format(e.start, 'HH:mm')} – {format(e.end, 'HH:mm')}
                  {e.vehiclePlate && ` · ${e.vehiclePlate}`}
                </p>
                {e.reservedBy && (
                  <p className="text-xs text-slate-400 mt-0.5">{e.reservedBy}</p>
                )}
                {(e.destination || e.description) && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {e.destination || e.description}
                  </p>
                )}
                <span
                  className={`inline-block text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-full ${
                    e.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {e.status === 'pending' ? 'Pendiente' : 'Activa'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

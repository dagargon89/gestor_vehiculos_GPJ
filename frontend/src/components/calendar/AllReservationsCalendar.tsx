import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, startOfWeek, getDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { MobileCalendar } from './MobileCalendar';
import { getVehicleColor, getVehicleColorPending } from '../../utils/vehicleColors';

const localizer = dateFnsLocalizer({
  format,
  parse: (s: string) => new Date(s),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

type ReservationEvent = {
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
  vehicleName?: string;
};

function EventWithTooltip({
  event,
  title,
}: {
  event: ReservationEvent;
  title: string;
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const eventTitle = event.title || title;
  const description = event.description;
  const destination = event.destination;
  const reservedBy = event.reservedBy;
  const vehiclePlate = event.vehiclePlate;
  const vehicleName = event.vehicleName;

  const timeFmt = isSameDay(event.start, event.end)
    ? (d: Date) => format(d, 'HH:mm', { locale: es })
    : (d: Date) => format(d, "dd MMM yyyy, HH:mm", { locale: es });
  const startTimeStr = timeFmt(event.start);
  const endTimeStr = timeFmt(event.end);

  const handleMouseEnter = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ x: rect.left, y: rect.bottom + 6 });
      setShow(true);
    }
  };

  const handleMouseLeave = () => setShow(false);

  const tooltipContent = (
    <div
      className="fixed z-[9999] w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800 text-white shadow-2xl shadow-black/40"
      style={{ left: coords.x, top: coords.y }}
      role="tooltip"
    >
      <div className="border-b border-slate-600/60 bg-slate-700/80 px-4 py-2">
        <p className="truncate text-sm font-semibold text-white">{eventTitle || 'Reserva'}</p>
      </div>
      <div className="px-4 py-3">
        <dl className="space-y-3 text-xs">
          {(vehicleName != null && vehicleName !== '') && (
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              <dt className="min-w-0 font-medium text-slate-400">Vehículo</dt>
              <dd className="text-slate-100">
                {vehicleName}
                {vehiclePlate && vehiclePlate !== '—' && (
                  <span className="ml-1.5 text-slate-400">({vehiclePlate})</span>
                )}
              </dd>
            </div>
          )}
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="min-w-0 font-medium text-slate-400">Hora de salida</dt>
            <dd className="text-slate-100">{startTimeStr}</dd>
            <dt className="min-w-0 font-medium text-slate-400">Hora de regreso</dt>
            <dd className="text-slate-100">{endTimeStr}</dd>
          </div>
          {(description != null && description !== '') && (
            <div className="border-t border-slate-600/50 pt-2">
              <dt className="mb-0.5 font-medium text-slate-400">Descripción</dt>
              <dd className="whitespace-pre-wrap break-words text-slate-100">{description}</dd>
            </div>
          )}
          {(destination != null && destination !== '') && (
            <div className="border-t border-slate-600/50 pt-2">
              <dt className="mb-0.5 font-medium text-slate-400">Ruta / Destino</dt>
              <dd className="text-slate-100">{destination}</dd>
            </div>
          )}
          <div className="border-t border-slate-600/50 pt-2">
            <dt className="mb-0.5 font-medium text-slate-400">Quien reservó</dt>
            <dd className="text-slate-100">{reservedBy || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={ref}
        className="inline-block w-full cursor-default"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="truncate block">{title}</span>
      </span>
      {show && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}

export type AllReservationsCalendarProps = {
  currentDate: Date;
  onNavigate?: (date: Date) => void;
  className?: string;
  minHeight?: number;
};

export function AllReservationsCalendar({
  currentDate,
  onNavigate,
  className = '',
  minHeight = 620,
}: AllReservationsCalendarProps) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const monthStart = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);
  const monthEnd = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    return d.toISOString();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', 'calendar', monthStart, monthEnd],
    queryFn: async () => {
      const res = await apiClient.get('/reservations', {
        params: { start: monthStart, end: monthEnd },
      });
      return res.data;
    },
  });

  const events: ReservationEvent[] = useMemo(() => {
    const inRange = reservations
      .filter((r: { status: string }) => r.status === 'pending' || r.status === 'active')
      .filter((r: { startDatetime: string; endDatetime: string }) => {
        const start = new Date(r.startDatetime).getTime();
        const end = new Date(r.endDatetime).getTime();
        const rangeStart = new Date(monthStart).getTime();
        const rangeEnd = new Date(monthEnd).getTime();
        return end >= rangeStart && start <= rangeEnd;
      });
    return inRange.map((r: Record<string, unknown>) => {
      const startDt = (r.startDatetime ?? r.start_datetime) as string;
      const endDt = (r.endDatetime ?? r.end_datetime) as string;
      const eventName = (r.eventName ?? r.event_name) as string | undefined;
      const vehicle = r.vehicle as { plate?: string; id?: string; brand?: string; model?: string } | undefined;
      const plate = vehicle?.plate ?? '—';
      const vehicleName = vehicle?.brand && vehicle?.model
        ? `${vehicle.brand} ${vehicle.model}`
        : plate;
      const title = eventName?.trim() ? `${vehicleName} – ${eventName}` : vehicleName;
      const desc = (r.description as string) ?? '';
      const dest = (r.destination as string) ?? '';
      const user = r.user as { displayName?: string; email?: string } | undefined;
      const reservedBy = user ? (user.displayName || user.email) : '';
      return {
        id: r.id as string,
        title,
        start: new Date(startDt),
        end: new Date(endDt),
        status: (r.status as string) ?? 'pending',
        vehicleId: ((r.vehicleId as string | undefined) ?? vehicle?.id ?? (r.id as string)),
        description: desc || undefined,
        destination: dest || undefined,
        reservedBy: reservedBy || undefined,
        vehiclePlate: plate !== '—' ? plate : undefined,
        vehicleName: vehicleName !== '—' ? vehicleName : undefined,
      };
    });
  }, [reservations, monthStart, monthEnd]);

  // Unique vehicles in current month's events for the legend
  const vehicleLegend = useMemo(() => {
    const seen = new Map<string, { label: string; plate?: string }>();
    for (const e of events) {
      if (e.vehicleId && !seen.has(e.vehicleId)) {
        seen.set(e.vehicleId, {
          label: e.vehicleName ?? e.vehiclePlate ?? '—',
          plate: e.vehiclePlate,
        });
      }
    }
    return Array.from(seen.entries()).map(([vehicleId, info]) => ({ vehicleId, ...info }));
  }, [events]);

  type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'work_week';
  const [view, setView] = useState<ViewType>('month');

  const eventStyleGetter = (event: ReservationEvent) => {
    const vid = event.vehicleId ?? event.id;
    const isPending = event.status === 'pending';
    const c = isPending ? getVehicleColorPending(vid) : getVehicleColor(vid);
    return {
      style: {
        backgroundColor: c.bg,
        borderLeft: `4px solid ${c.border}`,
        color: '#fff',
        borderRadius: '4px',
        marginBottom: '2px',
        boxSizing: 'border-box' as const,
      },
    };
  };

  const messages = useMemo(
    () => ({
      today: 'Hoy',
      previous: 'Ant.',
      next: 'Sig.',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      agenda: 'Agenda',
      date: 'Fecha',
      time: 'Hora',
      event: 'Evento',
      noEventsInRange: 'No hay reservas en este rango.',
    }),
    [],
  );

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
    >
      {isMobile ? (
        <MobileCalendar
          events={events}
          currentDate={currentDate}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          <div
            className="px-5 py-3 flex items-center flex-wrap gap-x-4 gap-y-1.5"
            style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-table-head-bg)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--color-text-muted)' }}>Vehículos</span>
            {vehicleLegend.map(({ vehicleId, label, plate }) => {
              const c = getVehicleColor(vehicleId);
              return (
                <div key={vehicleId} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.bg }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-soft)' }}>
                    {label}
                    {plate && <span className="ml-1 font-normal opacity-60">({plate})</span>}
                  </span>
                </div>
              );
            })}
            {vehicleLegend.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sin reservas este mes</span>
            )}
          </div>
          <div className="p-4 rbc-calendar-wrapper rbc-readonly" style={{ minHeight: `${minHeight}px`, height: `${minHeight}px` }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              tooltipAccessor={() => ''}
              view={view}
              onView={(v: ViewType) => setView(v)}
              date={currentDate}
              onNavigate={onNavigate}
              selectable={false}
              onDrillDown={() => {}}
              onSelectEvent={() => {}}
              eventPropGetter={eventStyleGetter}
              messages={messages}
              culture="es"
              popup
              components={{
                event: EventWithTooltip,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

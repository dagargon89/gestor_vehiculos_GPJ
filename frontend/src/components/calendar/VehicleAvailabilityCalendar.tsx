import { useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';

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
  resource?: { status: string };
  description?: string;
  destination?: string;
  reservedBy?: string;
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
  const hasAny = eventTitle || description || destination || reservedBy;

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!hasAny) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ x: rect.left, y: rect.bottom + 6 });
      setShow(true);
    }
  };

  const handleMouseLeave = () => setShow(false);

  const tooltipContent = hasAny && (
    <div
      className="fixed z-[9999] px-3 py-2 w-72 max-w-[90vw] rounded-lg bg-slate-800 text-white text-xs shadow-xl"
      style={{ left: coords.x, top: coords.y }}
      role="tooltip"
    >
      <div className="space-y-1.5">
        <div>
          <span className="font-semibold text-slate-200">Evento:</span>
          <p className="mt-0.5">{eventTitle || '—'}</p>
        </div>
        {description != null && description !== '' && (
          <div>
            <span className="font-semibold text-slate-200">Descripción:</span>
            <p className="mt-0.5 whitespace-pre-wrap break-words">{description}</p>
          </div>
        )}
        {destination != null && destination !== '' && (
          <div>
            <span className="font-semibold text-slate-200">Ruta / Destino:</span>
            <p className="mt-0.5">{destination}</p>
          </div>
        )}
        {reservedBy != null && reservedBy !== '' && (
          <div>
            <span className="font-semibold text-slate-200">Reservado por:</span>
            <p className="mt-0.5">{reservedBy}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={ref}
        className="inline-block w-full cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="truncate block">{title}</span>
      </span>
      {show && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}

type VehicleAvailabilityCalendarProps = {
  vehicleId: string | null;
  currentDate: Date;
  onNavigate?: (date: Date) => void;
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  className?: string;
  /** Altura mínima del calendario en px para que la vista mes se vea completa */
  minHeight?: number;
};

export function VehicleAvailabilityCalendar({
  vehicleId,
  currentDate,
  onNavigate,
  onSelectSlot,
  className = '',
  minHeight = 400,
}: VehicleAvailabilityCalendarProps) {
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
    queryKey: ['reservations', vehicleId],
    queryFn: async () => {
      const res = await apiClient.get('/reservations', {
        params: { vehicleId },
      });
      return res.data;
    },
    enabled: !!vehicleId,
  });

  const events: ReservationEvent[] = useMemo(() => {
    const blocking = reservations.filter(
      (r: { status: string }) => r.status === 'pending' || r.status === 'active',
    );
    const inMonth = blocking.filter((r: { startDatetime: string; endDatetime: string }) => {
      const start = new Date(r.startDatetime).getTime();
      const end = new Date(r.endDatetime).getTime();
      const rangeStart = new Date(monthStart).getTime();
      const rangeEnd = new Date(monthEnd).getTime();
      return end >= rangeStart && start <= rangeEnd;
    });
    return inMonth.map((r: Record<string, unknown>) => {
      const startDt = (r.startDatetime ?? r.start_datetime) as string;
      const endDt = (r.endDatetime ?? r.end_datetime) as string;
      const eventName = (r.eventName ?? r.event_name ?? 'Reserva') as string;
      const desc = (r.description as string) ?? '';
      const dest = (r.destination as string) ?? '';
      const user = r.user as { displayName?: string; email?: string } | undefined;
      const reservedBy = user ? (user.displayName || user.email) : '';
      return {
        id: r.id as string,
        title: eventName,
        start: new Date(startDt),
        end: new Date(endDt),
        status: (r.status as string) ?? 'pending',
        resource: { status: r.status },
        description: desc || undefined,
        destination: dest || undefined,
        reservedBy: reservedBy || undefined,
      };
    });
  }, [reservations, monthStart, monthEnd]);

  const eventStyleGetter = (event: ReservationEvent) => {
    const isPending = event.status === 'pending';
    return {
      style: {
        backgroundColor: isPending ? '#f59e0b' : '#dc2626',
        borderLeft: `4px solid ${isPending ? '#d97706' : '#b91c1c'}`,
        color: '#fff',
        borderRadius: '4px',
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

  if (!vehicleId) {
    return (
      <div className={`bg-white rounded-[16px] border border-slate-200 p-6 ${className}`}>
        <p className="text-slate-500 text-center py-8">
          Selecciona un vehículo para ver su disponibilidad.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-[16px] border border-slate-200 overflow-hidden ${className}`}>
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-600">
          <span className="inline-block w-3 h-3 rounded bg-amber-500 mr-1" /> Pendiente
          <span className="inline-block w-3 h-3 rounded bg-red-600 ml-3 mr-1" /> Activa
        </p>
      </div>
      <div className="p-4 rbc-calendar-wrapper" style={{ minHeight: `${minHeight}px`, height: `${minHeight}px` }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          tooltipAccessor={() => ''}
          view="month"
          date={currentDate}
          onNavigate={onNavigate}
          onSelectSlot={onSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="es"
          components={{
            event: EventWithTooltip,
          }}
        />
      </div>
    </div>
  );
}

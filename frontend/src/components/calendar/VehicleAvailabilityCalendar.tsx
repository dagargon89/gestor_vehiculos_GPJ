import { useMemo } from 'react';
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
};

type VehicleAvailabilityCalendarProps = {
  vehicleId: string | null;
  currentDate: Date;
  onNavigate?: (date: Date) => void;
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  className?: string;
};

export function VehicleAvailabilityCalendar({
  vehicleId,
  currentDate,
  onNavigate,
  onSelectSlot,
  className = '',
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
    queryKey: ['reservations', vehicleId, monthStart, monthEnd],
    queryFn: async () => {
      const res = await apiClient.get('/reservations', {
        params: { vehicleId, start: monthStart, end: monthEnd },
      });
      return res.data;
    },
    enabled: !!vehicleId,
  });

  const events: ReservationEvent[] = useMemo(() => {
    const blocking = reservations.filter(
      (r: { status: string }) => r.status === 'pending' || r.status === 'active',
    );
    return blocking.map((r: { id: string; eventName?: string; startDatetime: string; endDatetime: string; status: string }) => ({
      id: r.id,
      title: r.eventName || 'Reserva',
      start: new Date(r.startDatetime),
      end: new Date(r.endDatetime),
      status: r.status,
      resource: { status: r.status },
    }));
  }, [reservations]);

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
      <div className="p-4 min-h-[400px] rbc-calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          view="month"
          date={currentDate}
          onNavigate={onNavigate}
          onSelectSlot={onSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="es"
        />
      </div>
    </div>
  );
}

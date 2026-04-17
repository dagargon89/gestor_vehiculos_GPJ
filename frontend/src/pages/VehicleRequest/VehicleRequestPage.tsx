import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { VehicleAvailabilityCalendar } from '../../components/calendar/VehicleAvailabilityCalendar';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useAuth } from '../../contexts/AuthContext';
import { isConductor } from '../../config/routePermissions';

type User = { id: string; email: string; displayName?: string };
type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  status: string;
  currentOdometer?: number;
  photoUrls?: string | null;
  lastFuelLevel?: string | null;
  lastUsedByUser?: string | null;
};

const VEHICLE_STATUS_OPTIONS: Record<string, string> = {
  available: 'Disponible',
  in_use: 'En uso',
  maintenance: 'Mantenimiento',
};

function getFirstPhotoUrl(photoUrls: string | null | undefined): string | null {
  if (!photoUrls || !photoUrls.trim()) return null;
  try {
    const parsed = JSON.parse(photoUrls) as string[];
    return Array.isArray(parsed) && parsed[0] ? parsed[0] : null;
  } catch {
    const first = photoUrls.split(',')[0]?.trim();
    return first || null;
  }
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'available') return { background: 'rgba(34,197,94,0.18)', color: '#4ade80' };
  if (status === 'in_use') return { background: 'rgba(245,158,11,0.18)', color: '#fbbf24' };
  return { background: 'rgba(148,163,184,0.18)', color: 'var(--color-text-muted)' };
}

function ReserveVehicleModal({
  vehicle,
  onClose,
  onSuccess,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const esConductor = isConductor(userData?.role?.name);
  const [userId, setUserId] = useState(() => esConductor && userData?.id ? userData.id : '');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
    enabled: !esConductor,
  });

  const toDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    setStartDatetime(toDatetimeLocal(slot.start));
    setEndDatetime(toDatetimeLocal(slot.end));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Las fechas no son válidas. Revisa hora de salida y de regreso.');
      return;
    }
    const yearMin = 2020;
    const yearMax = 2035;
    if (start.getFullYear() < yearMin || start.getFullYear() > yearMax || end.getFullYear() < yearMin || end.getFullYear() > yearMax) {
      setError(`El año debe estar entre ${yearMin} y ${yearMax}. Revisa las fechas.`);
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError('La hora de regreso debe ser posterior a la hora de salida.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/reservations', {
        vehicleId: vehicle.id,
        userId,
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        status: 'pending',
        eventName: eventName.trim() || undefined,
        description: description.trim() || undefined,
        destination: destination.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      let msg = 'Error al enviar la solicitud';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
        const m = res?.message;
        if (Array.isArray(m)) msg = m.join('. ');
        else if (typeof m === 'string') msg = m;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-[90rem] min-h-[90vh] max-h-[98vh] overflow-y-auto my-2 flex flex-col rounded-[16px]"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Reservar: {vehicle.plate} – {vehicle.brand} {vehicle.model}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Cerrar"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 space-y-4 flex flex-col min-h-0 order-2 lg:order-1">
              <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Calendario de disponibilidad</h4>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Los días en naranja/rojo tienen reservas. Selecciona un hueco para elegir fecha y hora.
              </p>
              <div className="flex-1 min-h-[320px] md:min-h-[560px]">
                <VehicleAvailabilityCalendar
                  vehicleId={vehicle.id}
                  currentDate={calendarDate}
                  onNavigate={(d) => setCalendarDate(d)}
                  onSelectSlot={handleSelectSlot}
                  className="h-full"
                  minHeight={620}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Fecha y hora de salida *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDatetime}
                    onChange={(e) => setStartDatetime(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Fecha y hora de regreso *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDatetime}
                    onChange={(e) => setEndDatetime(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4 order-1 lg:order-2 min-w-0">
              <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Datos de la solicitud</h4>
              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
                >
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Solicitar para usuario *</label>
                {esConductor ? (
                  <div
                    className="w-full px-3 py-2 rounded-lg font-medium flex items-center gap-2"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-soft)' }}
                  >
                    <span className="material-icons text-base" style={{ color: 'var(--color-text-muted)' }}>person</span>
                    {userData?.displayName || userData?.email || 'Usuario actual'}
                  </div>
                ) : (
                  <SearchSelect
                    options={users.map((u: User) => ({ value: u.id, label: u.displayName || u.email }))}
                    value={userId}
                    onChange={setUserId}
                    placeholder="Seleccionar usuario"
                    required
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Evento</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Nombre del evento o propósito del viaje"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Descripción del viaje</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Destino / Ruta</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destino o ruta prevista"
                  className="input-field w-full"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3 disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VehicleRequestPage() {
  const [reserveVehicle, setReserveVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="text-primary font-bold">Cargando vehículos...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Solicitud de vehículos</h2>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Elige un vehículo y haz clic en Reservar para ver disponibilidad y enviar tu solicitud.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vehicles.length === 0 ? (
          <div
            className="col-span-full rounded-[16px] px-6 py-12 text-center"
            style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            No hay vehículos registrados.
          </div>
        ) : (
          vehicles.map((v: Vehicle) => {
            const photoUrl = getFirstPhotoUrl(v.photoUrls);
            const statusLabel = VEHICLE_STATUS_OPTIONS[v.status] ?? v.status;
            return (
              <div
                key={v.id}
                className="rounded-[16px] overflow-hidden flex flex-col transition-shadow"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,132,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
              >
                <div
                  className="aspect-[4/3] relative"
                  style={{ background: 'var(--color-table-head-bg)' }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${v.plate} ${v.brand} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="material-icons text-6xl">directions_car</span>
                    </div>
                  )}
                  <span
                    className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
                    style={statusBadgeStyle(v.status)}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="font-bold text-lg font-mono-data" style={{ color: 'var(--color-text)' }}>{v.plate}</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-soft)' }}>
                    {v.brand} {v.model}
                    {v.year != null && ` (${v.year})`}
                  </div>
                  {v.color && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{v.color}</div>
                  )}
                  {v.currentOdometer != null && (
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Kilometraje: {v.currentOdometer.toLocaleString()} km</div>
                  )}
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Gasolina: {v.lastFuelLevel ?? '—'}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Último uso: {v.lastUsedByUser ?? '—'}</div>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      type="button"
                      onClick={() => setReserveVehicle(v)}
                      disabled={v.status === 'maintenance'}
                      className="btn-primary w-full py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {v.status === 'maintenance' ? 'En mantenimiento' : 'Reservar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {reserveVehicle && (
        <ReserveVehicleModal
          vehicle={reserveVehicle}
          onClose={() => setReserveVehicle(null)}
          onSuccess={() => setReserveVehicle(null)}
        />
      )}
    </div>
  );
}

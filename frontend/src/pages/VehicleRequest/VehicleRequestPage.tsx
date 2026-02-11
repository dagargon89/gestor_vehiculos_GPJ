import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { VehicleAvailabilityCalendar } from '../../components/calendar/VehicleAvailabilityCalendar';
import { SearchSelect } from '../../components/ui/SearchSelect';

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
  const [userId, setUserId] = useState('');
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
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-[90rem] min-h-[90vh] max-h-[98vh] overflow-y-auto my-2 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">
            Reservar: {vehicle.plate} – {vehicle.brand} {vehicle.model}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 space-y-4 flex flex-col min-h-0 order-2 lg:order-1">
              <h4 className="text-sm font-bold text-slate-700">Calendario de disponibilidad</h4>
              <p className="text-xs text-slate-500">
                Los días en naranja/rojo tienen reservas. Selecciona un hueco para elegir fecha y hora.
              </p>
              <div className="flex-1 min-h-[320px] md:min-h-[560px]">
                <VehicleAvailabilityCalendar
                  vehicleId={vehicle.id}
                  currentDate={calendarDate}
                  onNavigate={(d) => setCalendarDate(d)}
                  onSelectSlot={handleSelectSlot}
                  className="h-full"
                  minHeight={520}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora de salida *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDatetime}
                    onChange={(e) => setStartDatetime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora de regreso *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDatetime}
                    onChange={(e) => setEndDatetime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4 order-1 lg:order-2 min-w-0">
              <h4 className="text-sm font-bold text-slate-700">Datos de la solicitud</h4>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solicitar para usuario *</label>
                <SearchSelect
                  options={users.map((u: User) => ({ value: u.id, label: u.displayName || u.email }))}
                  value={userId}
                  onChange={setUserId}
                  placeholder="Seleccionar usuario"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Evento</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Nombre del evento o propósito del viaje"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del viaje</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destino / Ruta</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destino o ruta prevista"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-primary-dark text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
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
      <h2 className="text-2xl font-bold text-slate-900">Solicitud de vehículos</h2>
      <p className="text-slate-600">Elige un vehículo y haz clic en Reservar para ver disponibilidad y enviar tu solicitud.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
            No hay vehículos registrados.
          </div>
        ) : (
          vehicles.map((v: Vehicle) => {
            const photoUrl = getFirstPhotoUrl(v.photoUrls);
            const statusLabel = VEHICLE_STATUS_OPTIONS[v.status] ?? v.status;
            const statusColor =
              v.status === 'available'
                ? 'bg-green-100 text-green-800'
                : v.status === 'in_use'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700';
            return (
              <div
                key={v.id}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-slate-100 relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${v.plate} ${v.brand} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <span className="material-icons text-6xl">directions_car</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="font-bold text-slate-900 text-lg">{v.plate}</div>
                  <div className="text-slate-600 text-sm">
                    {v.brand} {v.model}
                    {v.year != null && ` (${v.year})`}
                  </div>
                  {v.color && (
                    <div className="text-slate-500 text-xs mt-0.5">{v.color}</div>
                  )}
                  {v.currentOdometer != null && (
                    <div className="text-slate-500 text-xs">Odómetro: {v.currentOdometer.toLocaleString()} km</div>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setReserveVehicle(v)}
                      className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium text-sm"
                    >
                      Reservar
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

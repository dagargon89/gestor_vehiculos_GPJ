/**
 * Versión anterior: formulario + calendario en dos columnas.
 * Conservado por referencia. La página actual muestra tarjetas de vehículos
 * y al hacer clic en "Reservar" se abre un modal con calendario y campos.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { VehicleAvailabilityCalendar } from '../../components/calendar/VehicleAvailabilityCalendar';

type User = { id: string; email: string; displayName?: string };
type Vehicle = { id: string; plate: string; brand: string; model: string };

type RequestFormState = {
  vehicleId: string;
  userId: string;
  startDatetime: string;
  endDatetime: string;
  eventName: string;
  description: string;
  destination: string;
};

function RequestReservationForm({
  form,
  setForm,
  vehicles,
  users,
  onSuccess,
}: {
  form: RequestFormState;
  setForm: React.Dispatch<React.SetStateAction<RequestFormState>>;
  vehicles: Vehicle[];
  users: User[];
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/reservations', {
        vehicleId: form.vehicleId,
        userId: form.userId,
        startDatetime: new Date(form.startDatetime).toISOString(),
        endDatetime: new Date(form.endDatetime).toISOString(),
        status: 'pending',
        eventName: form.eventName.trim() || undefined,
        description: form.description.trim() || undefined,
        destination: form.destination.trim() || undefined,
      });
      onSuccess();
      setForm({
        vehicleId: form.vehicleId,
        userId: form.userId,
        startDatetime: '',
        endDatetime: '',
        eventName: '',
        description: '',
        destination: '',
      });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al enviar';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Solicitar para usuario *</label>
        <select
          required
          value={form.userId}
          onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Seleccionar usuario</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Selecciona el vehículo *</label>
        <select
          required
          value={form.vehicleId}
          onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Seleccionar vehículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate} – {v.brand} {v.model}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora de salida *</label>
        <input
          type="datetime-local"
          required
          value={form.startDatetime}
          onChange={(e) => setForm((f) => ({ ...f, startDatetime: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora de regreso *</label>
        <input
          type="datetime-local"
          required
          value={form.endDatetime}
          onChange={(e) => setForm((f) => ({ ...f, endDatetime: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Evento</label>
        <input
          type="text"
          value={form.eventName}
          onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
          placeholder="Nombre del evento"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del viaje</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Breve descripción"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Destino / Ruta</label>
        <input
          type="text"
          value={form.destination}
          onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          placeholder="Destino o ruta prevista"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 bg-primary-dark text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
}

export function VehicleRequestPageBackup() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RequestFormState>({
    vehicleId: '',
    userId: '',
    startDatetime: '',
    endDatetime: '',
    eventName: '',
    description: '',
    destination: '',
  });
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

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
    setForm((f) => ({
      ...f,
      startDatetime: toDatetimeLocal(slot.start),
      endDatetime: toDatetimeLocal(slot.end),
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Solicitud de vehículos</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Solicitud de reserva</h3>
          <RequestReservationForm
            form={form}
            setForm={setForm}
            vehicles={vehicles}
            users={users}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['reservations'] })}
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Disponibilidad del vehículo</h3>
          <VehicleAvailabilityCalendar
            vehicleId={form.vehicleId || null}
            currentDate={calendarDate}
            onNavigate={(d) => setCalendarDate(d)}
            onSelectSlot={handleSelectSlot}
          />
        </div>
      </div>
    </div>
  );
}

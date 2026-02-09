import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';

type User = { id: string; email: string; displayName?: string };
type Vehicle = { id: string; plate: string; brand: string; model: string };

type Reservation = {
  id: string;
  userId: string;
  vehicleId: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  vehicle?: Vehicle;
  user?: User;
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activa' },
  { value: 'completed', label: 'Completada' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' },
];

function ReservationFormModal({
  reservation,
  vehicles,
  users,
  onClose,
  onSuccess,
}: {
  reservation: Reservation | null;
  vehicles: Vehicle[];
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(() => {
    const start = reservation?.startDatetime
      ? new Date(reservation.startDatetime).toISOString().slice(0, 16)
      : '';
    const end = reservation?.endDatetime
      ? new Date(reservation.endDatetime).toISOString().slice(0, 16)
      : '';
    return {
      vehicleId: reservation?.vehicleId ?? '',
      userId: reservation?.userId ?? '',
      startDatetime: start,
      endDatetime: end,
      status: reservation?.status ?? 'pending',
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        userId: form.userId,
        startDatetime: new Date(form.startDatetime).toISOString(),
        endDatetime: new Date(form.endDatetime).toISOString(),
        status: form.status,
      };
      if (reservation) {
        await apiClient.put(`/reservations/${reservation.id}`, payload);
      } else {
        await apiClient.post('/reservations', payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al guardar';
      setError(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {reservation ? 'Editar reserva' : 'Nueva reserva'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehículo *</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Seleccionar vehículo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} – {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario *</label>
            <select
              required
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Seleccionar usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Inicio *</label>
            <input
              type="datetime-local"
              required
              value={form.startDatetime}
              onChange={(e) => setForm((f) => ({ ...f, startDatetime: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fin *</label>
            <input
              type="datetime-local"
              required
              value={form.endDatetime}
              onChange={(e) => setForm((f) => ({ ...f, endDatetime: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : reservation ? 'Guardar cambios' : 'Crear reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReservationsList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await apiClient.get('/reservations');
      return res.data;
    },
  });

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reservations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const openCreate = () => {
    setEditingReservation(null);
    setModalOpen(true);
  };

  const openEdit = (r: Reservation) => {
    setEditingReservation(r);
    setModalOpen(true);
  };

  const handleDelete = (r: Reservation) => {
    const label = r.vehicle?.plate
      ? `Reserva de ${r.vehicle.plate} (${new Date(r.startDatetime).toLocaleString()})`
      : `Reserva ${r.id}`;
    if (!window.confirm(`¿Eliminar la reserva: ${label}?`)) return;
    deleteMutation.mutate(r.id);
  };

  if (isLoading) return <div className="text-primary font-bold">Cargando reservas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Reservas</h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
        >
          Nueva reserva
        </button>
      </div>
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Vehículo</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuario</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Inicio</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fin</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
              <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay reservas.</td>
              </tr>
            ) : (
              reservations.map((r: Reservation) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{r.vehicle?.plate ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{(r.user?.displayName || r.user?.email) ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(r.startDatetime).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(r.endDatetime).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">
                      {STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="text-primary font-medium hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="text-red-600 font-medium hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <ReservationFormModal
          reservation={editingReservation}
          vehicles={vehicles}
          users={users}
          onClose={() => setModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['reservations'] })}
        />
      )}
    </div>
  );
}

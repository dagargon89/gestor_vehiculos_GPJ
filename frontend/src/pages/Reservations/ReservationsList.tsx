import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { useAuth } from '../../contexts/AuthContext';
import { isConductor } from '../../config/routePermissions';

type User = { id: string; email: string; displayName?: string };
type Vehicle = { id: string; plate: string; brand: string; model: string };

type Reservation = {
  id: string;
  userId: string;
  vehicleId: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  eventName?: string;
  description?: string;
  destination?: string;
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
  const { userData } = useAuth();
  const esConductor = isConductor(userData?.role?.name);

  const [form, setForm] = useState(() => {
    const toLocal = (iso: string) => {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const start = reservation?.startDatetime ? toLocal(reservation.startDatetime) : '';
    const end   = reservation?.endDatetime   ? toLocal(reservation.endDatetime)   : '';
    return {
      vehicleId: reservation?.vehicleId ?? '',
      userId: reservation?.userId ?? (esConductor && userData?.id ? userData.id : ''),
      startDatetime: start,
      endDatetime: end,
      status: reservation?.status ?? 'pending',
      eventName: reservation?.eventName ?? '',
      description: reservation?.description ?? '',
      destination: reservation?.destination ?? '',
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
        status: reservation ? form.status : 'pending',
        eventName: form.eventName.trim() || undefined,
        description: form.description.trim() || undefined,
        destination: form.destination.trim() || undefined,
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
            <SearchSelect
              options={vehicles.map((v) => ({ value: v.id, label: `${v.plate} – ${v.brand} ${v.model}` }))}
              value={form.vehicleId}
              onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))}
              placeholder="Seleccionar vehículo"
              required
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario *</label>
            {esConductor ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium flex items-center gap-2">
                <span className="material-icons text-slate-400 text-base">person</span>
                {userData?.displayName || userData?.email || 'Usuario actual'}
              </div>
            ) : (
              <SearchSelect
                options={users.map((u) => ({ value: u.id, label: u.displayName || u.email }))}
                value={form.userId}
                onChange={(v) => setForm((f) => ({ ...f, userId: v }))}
                placeholder="Seleccionar usuario"
                required
                className="w-full"
              />
            )}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Evento</label>
            <input
              type="text"
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              placeholder="Nombre del evento o propósito del viaje"
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
          {reservation && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <SearchSelect
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                placeholder="Estado"
                className="w-full"
              />
            </div>
          )}
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
              {submitting ? 'Guardando...' : reservation ? 'Guardar cambios' : 'Enviar solicitud'}
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
  const [filterStatus, setFilterStatus] = useState('');

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

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/reservations/${id}`, { status: 'active' }),
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

  const getVehicleLabel = (r: Reservation) => {
    const v = r.vehicle ?? vehicles.find((x: Vehicle) => x.id === r.vehicleId);
    return v ? v.plate : '—';
  };
  const getUserLabel = (r: Reservation) => {
    const fromList = r.userId?.trim() ? users.find((x: User) => x.id === r.userId) : null;
    const u = r.user ?? fromList;
    if (!u) return '—';
    const name = (u as { displayName?: string; display_name?: string }).displayName
      ?? (u as { displayName?: string; display_name?: string }).display_name;
    return name || u.email || '—';
  };

  const handleDelete = (r: Reservation) => {
    const plate = getVehicleLabel(r);
    const label = plate !== '—'
      ? `Reserva de ${plate} (${new Date(r.startDatetime).toLocaleString()})`
      : `Reserva ${r.id}`;
    if (!window.confirm(`¿Eliminar la reserva: ${label}?`)) return;
    deleteMutation.mutate(r.id);
  };

  const filteredReservations = filterStatus
    ? reservations.filter((r: Reservation) => r.status === filterStatus)
    : reservations;

  const {
    paginatedData: paginatedReservations,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = usePagination<Reservation>(filteredReservations, { pageSize: 25 });

  const exportHeaders = ['Vehículo', 'Usuario', 'Inicio', 'Fin', 'Estado'];
  const getExportRows = (list: Reservation[]) =>
    list.map((r) => [
      getVehicleLabel(r),
      getUserLabel(r),
      new Date(r.startDatetime).toLocaleString(),
      new Date(r.endDatetime).toLocaleString(),
      STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status,
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando reservas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de reservas</h2>
        <div className="flex flex-wrap items-center gap-3">
            <SearchSelect
              options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Todos los estados"
              className="w-48"
            />
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
            >
              Nueva reserva (admin)
            </button>
          </div>
      </div>
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
            <TableToolbar
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredReservations), 'reservas.csv')}
              onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredReservations), 'reservas.xlsx', 'Reservas')}
              onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredReservations), 'reservas.pdf', 'Reservas')}
            />
            <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
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
                {paginatedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay reservas.</td>
                  </tr>
                ) : (
                  paginatedReservations.map((r: Reservation) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{getVehicleLabel(r)}</td>
                      <td className="px-6 py-4 text-slate-600">{getUserLabel(r)}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(r.startDatetime).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(r.endDatetime).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">
                          {STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                            className="mr-3 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                        )}
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

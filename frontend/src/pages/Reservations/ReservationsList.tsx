import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { validateReservationDates } from '../../lib/reservationDates';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { useAuth } from '../../contexts/AuthContext';
import { isConductor } from '../../config/routePermissions';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

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
  checkinOdometer?: number | null;
  checkoutOdometer?: number | null;
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

// Folio corto derivado del id — solo de despliegue, no existe como campo en backend.
function getFolio(r: { id: string }) {
  return `RES-${r.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function statusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'pending':   return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
    case 'active':    return { background: 'rgba(34,197,94,0.15)',  color: '#4ade80' };
    case 'completed': return { background: 'rgba(148,163,184,0.15)', color: 'var(--color-text-muted)' };
    case 'overdue':   return { background: 'rgba(239,68,68,0.15)',  color: '#f87171' };
    case 'cancelled': return { background: 'rgba(148,163,184,0.12)', color: 'var(--color-text-muted)' };
    default:          return { background: 'rgba(148,163,184,0.12)', color: 'var(--color-text-muted)' };
  }
}

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

  const toLocal = (iso: string | Date) => {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState(() => {
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
    const validationError = validateReservationDates(form.startDatetime, form.endDatetime, {
      allowPast: Boolean(reservation), // al editar una reserva existente se permite conservar/corregir fechas pasadas
    });
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }
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
    <Modal title={reservation ? 'Editar reserva' : 'Nueva reserva'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              min={reservation ? undefined : toLocal(new Date())}
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
    </Modal>
  );
}

function OverduePanel() {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const { data: overdue = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['reservations-overdue'],
    queryFn: async () => {
      const res = await apiClient.get('/reservations?status=overdue');
      return res.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading || overdue.length === 0) return null;

  const getUserLabel = (r: Reservation) => {
    const u = r.user;
    if (!u) return '—';
    return (u as { displayName?: string }).displayName || u.email || '—';
  };

  const getVehicleLabel = (r: Reservation) => {
    const v = r.vehicle;
    return v ? `${v.plate} – ${v.brand} ${v.model}` : '—';
  };

  const getSituacion = (r: Reservation) =>
    r.checkinOdometer != null ? 'Salió, sin devolución' : 'Sin check-in ni devolución';

  const allSelected = overdue.length > 0 && overdue.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(overdue.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    setConfirmBulkDelete(true);
  };

  const performBulkDelete = async () => {
    setConfirmBulkDelete(false);
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => apiClient.delete(`/reservations/${id}`)));
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ['reservations-overdue'] });
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="rounded-[16px] border border-red-300 bg-red-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="material-icons text-red-600 text-xl">event_busy</span>
          <span className="font-bold text-red-800">
            Reservas vencidas: {overdue.length}
          </span>
          <span className="text-sm text-red-700">
            — selecciona y elimina los registros que ya no necesites
          </span>
        </div>
        <span className="material-icons text-red-600">
          {collapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-red-200">
          {selected.size > 0 && (
            <div className="flex items-center justify-between px-5 py-2 bg-red-100 border-b border-red-200">
              <span className="text-sm font-medium text-red-800">
                {selected.size} seleccionada{selected.size !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <span className="material-icons text-base">delete</span>
                {bulkDeleting ? 'Eliminando...' : `Eliminar seleccionadas (${selected.size})`}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-red-400 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-red-800 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-red-800 uppercase tracking-wide">Vehículo</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-red-800 uppercase tracking-wide">Evento</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-red-800 uppercase tracking-wide">Inicio</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-red-800 uppercase tracking-wide">Fin</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-red-800 uppercase tracking-wide">Situación</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => toggleOne(r.id)}
                    className={`border-t border-red-200 cursor-pointer ${selected.has(r.id) ? 'bg-red-100' : 'hover:bg-red-50'}`}
                  >
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-red-400 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">{getUserLabel(r)}</td>
                    <td className="px-5 py-3 text-slate-700">{getVehicleLabel(r)}</td>
                    <td className="px-5 py-3 text-slate-600">{r.eventName || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(r.startDatetime).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(r.endDatetime).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.checkinOdometer != null ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {getSituacion(r)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {confirmBulkDelete && (
        <ConfirmDialog
          message={`¿Eliminar ${selected.size} reserva${selected.size !== 1 ? 's' : ''} vencida${selected.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
          onCancel={() => setConfirmBulkDelete(false)}
          onConfirm={performBulkDelete}
        />
      )}
    </div>
  );
}

export function ReservationsList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);

  const { data: reservations = [], isLoading, isError, error, refetch } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      notifySuccess('Reserva eliminada correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar la reserva.'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/reservations/${id}`, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/reservations/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      notifySuccess('Reserva rechazada.');
    },
    onError: () => notifyError('No se pudo rechazar la reserva.'),
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
    setDeleteTarget(r);
  };

  const filteredReservations = filterStatus
    ? reservations.filter((r: Reservation) => r.status === filterStatus)
    : reservations;

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
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
  } = useDataTable<Reservation>(filteredReservations, {
    pageSize: 25,
    searchFields: (r) => [getVehicleLabel(r), getUserLabel(r), r.eventName ?? '', r.destination ?? ''],
  });

  const exportHeaders = ['Folio', 'Vehículo', 'Solicitante', 'Destino', 'Salida', 'Estado'];
  const getExportRows = (list: Reservation[]) =>
    list.map((r) => [
      getFolio(r),
      getVehicleLabel(r),
      getUserLabel(r),
      r.destination ?? '',
      new Date(r.startDatetime).toLocaleString(),
      STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status,
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando reservas...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="reservas"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  const reservationStats = [
    { n: reservations.filter((r: Reservation) => r.status === 'pending').length, label: 'Pendientes', c: 'var(--color-primary)' },
    { n: reservations.filter((r: Reservation) => r.status === 'active').length, label: 'Activas', c: '#4ade80' },
    { n: reservations.filter((r: Reservation) => r.status === 'overdue').length, label: 'Vencidas', c: '#f87171' },
  ];

  return (
    <div className="space-y-6">
      <OverduePanel />
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1
            className="text-[28px] font-semibold uppercase tracking-wide m-0"
            style={{ color: 'var(--color-text)', fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Reservas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Aprueba o rechaza directamente desde la tabla.
          </p>
        </div>
        <div className="flex gap-4">
          {reservationStats.map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-mono-data text-[22px] font-semibold" style={{ color: s.c }}>{s.n}</div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchSelect
          options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Todos los estados"
          className="w-48"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Folio, placa o solicitante..."
          className="input-field w-60"
        />
        <div className="flex-1" />
        <button type="button" onClick={openCreate} className="btn-primary">
          Nueva reserva (admin)
        </button>
      </div>
      <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
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
            <DataTable<Reservation>
              columns={[
                { key: 'folio', header: 'Folio', cellClassName: 'font-mono-data', cellStyle: { color: 'var(--color-primary)' }, render: (r) => getFolio(r) },
                {
                  key: 'vehicle',
                  header: 'Vehículo',
                  sortAccessor: (r) => getVehicleLabel(r),
                  render: (r) => (
                    <span
                      className="font-mono-data text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border-strong)' }}
                    >
                      {getVehicleLabel(r)}
                    </span>
                  ),
                },
                { key: 'user', header: 'Solicitante', sortAccessor: (r) => getUserLabel(r), cellClassName: 'font-medium', render: (r) => getUserLabel(r) },
                { key: 'destination', header: 'Destino', cellStyle: { color: 'var(--color-text-soft)' }, render: (r) => r.destination || '—' },
                {
                  key: 'start',
                  header: 'Salida',
                  sortAccessor: (r) => r.startDatetime,
                  cellClassName: 'font-mono-data whitespace-nowrap',
                  cellStyle: { color: 'var(--color-text-soft)' },
                  render: (r) => new Date(r.startDatetime).toLocaleString(),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  sortAccessor: (r) => r.status,
                  render: (r) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={statusBadgeStyle(r.status)}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  align: 'right',
                  render: (r) => (
                    <>
                      {r.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            title="Aprobar"
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                            className="mr-1.5 w-8 h-8 rounded-lg inline-flex items-center justify-center disabled:opacity-50"
                            style={{ border: '1px solid var(--color-border)', color: '#4ade80' }}
                          >
                            <span className="material-icons text-[17px]">check</span>
                          </button>
                          <button
                            type="button"
                            title="Rechazar"
                            onClick={() => rejectMutation.mutate(r.id)}
                            disabled={rejectMutation.isPending}
                            className="mr-3 w-8 h-8 rounded-lg inline-flex items-center justify-center disabled:opacity-50"
                            style={{ border: '1px solid var(--color-border)', color: '#f87171' }}
                          >
                            <span className="material-icons text-[17px]">close</span>
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => openEdit(r)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(r)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                    </>
                  ),
                },
              ]}
              rows={paginatedReservations}
              getRowKey={(r) => r.id}
              emptyMessage="No hay reservas."
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
      </div>

      {modalOpen && (
        <ReservationFormModal
          reservation={editingReservation}
          vehicles={vehicles}
          users={users}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            notifySuccess('Reserva guardada correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={(() => {
            const plate = getVehicleLabel(deleteTarget);
            const label = plate !== '—'
              ? `Reserva de ${plate} (${new Date(deleteTarget.startDatetime).toLocaleString()})`
              : `Reserva ${deleteTarget.id}`;
            return `¿Eliminar la reserva: ${label}?`;
          })()}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

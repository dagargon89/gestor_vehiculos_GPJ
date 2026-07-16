import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { useAuth } from '../../contexts/AuthContext';
import { isConductor } from '../../config/routePermissions';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type Vehicle = { id: string; plate: string; brand: string; model: string };
type User = { id: string; displayName?: string; email?: string };

type Incident = {
  id: string;
  vehicleId: string;
  userId?: string;
  date: string;
  description: string;
  status: string;
  vehicle?: Vehicle;
  user?: User;
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
];

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-red',
  in_review: 'badge-amber',
  resolved: 'badge-green',
  closed: 'badge-slate',
};

function IncidentFormModal({
  incident,
  vehicles,
  users,
  onClose,
  onSuccess,
}: {
  incident: Incident | null;
  vehicles: Vehicle[];
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { userData } = useAuth();
  const esConductor = isConductor(userData?.role?.name);

  const [form, setForm] = useState({
    vehicleId: incident?.vehicleId ?? '',
    userId: incident?.userId ?? (esConductor && userData?.id ? userData.id : ''),
    date: incident?.date ? incident.date.slice(0, 10) : '',
    description: incident?.description ?? '',
    status: incident?.status ?? 'open',
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
        userId: form.userId || undefined,
        date: form.date,
        description: form.description.trim(),
        status: form.status,
      };
      if (incident) {
        await apiClient.put(`/incidents/${incident.id}`, payload);
      } else {
        await apiClient.post('/incidents', payload);
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
        className="rounded-[16px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {incident ? 'Editar incidente' : 'Nuevo incidente'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Vehículo *</label>
            <SearchSelect
              options={vehicles.map((v) => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }))}
              value={form.vehicleId}
              onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))}
              placeholder="Seleccionar..."
              required
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Usuario (opcional)</label>
            {esConductor ? (
              <div
                className="w-full px-3 py-2 rounded-lg font-medium flex items-center gap-2"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <span className="material-icons text-base" style={{ color: 'var(--color-text-muted)' }}>person</span>
                {userData?.displayName || userData?.email || 'Usuario actual'}
              </div>
            ) : (
              <SearchSelect
                options={[{ value: '', label: 'Ninguno' }, ...users.map((u) => ({ value: u.id, label: u.displayName || u.email || u.id }))]}
                value={form.userId}
                onChange={(v) => setForm((f) => ({ ...f, userId: v }))}
                placeholder="Ninguno"
                className="w-full"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Fecha *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Estado</label>
            <SearchSelect
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              placeholder="Estado"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Descripción *</label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Guardando...' : incident ? 'Guardar cambios' : 'Crear incidente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function IncidentList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('incidentView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);

  const { data: incidentList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['incidents', filterVehicleId || undefined, filterStatus || undefined],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterVehicleId) params.vehicleId = filterVehicleId;
      if (filterStatus) params.status = filterStatus;
      const res = await apiClient.get('/incidents', { params });
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
    mutationFn: (id: string) => apiClient.delete(`/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      notifySuccess('Incidente eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el incidente.'),
  });

  const openCreate = () => {
    setEditingIncident(null);
    setModalOpen(true);
  };

  const openEdit = (i: Incident) => {
    setEditingIncident(i);
    setModalOpen(true);
  };

  const handleDelete = (i: Incident) => {
    setDeleteTarget(i);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const getVehicle = (i: Incident) => i.vehicle ?? vehicles.find((x: Vehicle) => x.id === i.vehicleId);
  const getVehicleLabel = (i: Incident) => {
    const v = getVehicle(i);
    return v ? v.plate : '—';
  };
  const getVehicleFullLabel = (i: Incident) => {
    const v = getVehicle(i);
    return v ? `${v.plate} — ${v.brand} ${v.model}` : '—';
  };
  const getUserLabel = (i: Incident) => {
    const fromRelation = i.user;
    const fromList = i.userId?.trim() ? users.find((x: User) => x.id === i.userId) : null;
    const u = fromRelation ?? fromList;
    if (!u) return '—';
    const name = (u as { displayName?: string; display_name?: string }).displayName
      ?? (u as { displayName?: string; display_name?: string }).display_name;
    return name || u.email || '—';
  };

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedIncidents,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<Incident>(incidentList, {
    pageSize: 25,
    searchFields: (i) => [getVehicleFullLabel(i), getUserLabel(i), i.description ?? ''],
  });

  const exportHeaders = ['Vehículo', 'Usuario', 'Fecha', 'Estado', 'Descripción'];
  const getExportRows = (list: Incident[]) =>
    list.map((i) => [
      getVehicleLabel(i),
      getUserLabel(i),
      formatDate(i.date),
      STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status,
      (i.description ?? '').slice(0, 100),
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando incidentes...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="incidentes"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Incidentes</h2>
        <div className="flex items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los vehículos' }, ...vehicles.map((v: Vehicle) => ({ value: v.id, label: v.plate }))]}
            value={filterVehicleId}
            onChange={setFilterVehicleId}
            placeholder="Todos los vehículos"
            className="w-48"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos los estados"
            className="w-48"
          />
          <ViewToggle value={view} onChange={setView} storageKey="incidentView" />
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Reportar incidencia
          </button>
        </div>
      </div>

      {view === 'table' && (
        <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por vehículo, usuario o descripción..."
              className="input-field w-full max-w-sm"
            />
          </div>
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(incidentList), 'incidentes.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(incidentList), 'incidentes.xlsx', 'Incidentes')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(incidentList), 'incidentes.pdf', 'Incidentes')}
          />
          <DataTable<Incident>
            columns={[
              { key: 'vehicle', header: 'Vehículo', sortAccessor: (i) => getVehicleLabel(i), cellClassName: 'font-medium', render: (i) => getVehicleLabel(i) },
              { key: 'user', header: 'Usuario', sortAccessor: (i) => getUserLabel(i), render: (i) => getUserLabel(i) },
              { key: 'date', header: 'Fecha', sortAccessor: (i) => i.date, render: (i) => formatDate(i.date) },
              {
                key: 'status',
                header: 'Estado',
                render: (i) => (
                  <span className={`badge ${STATUS_BADGE[i.status] ?? 'badge-slate'}`}>
                    {STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status}
                  </span>
                ),
              },
              { key: 'description', header: 'Descripción', cellClassName: 'max-w-[200px] truncate', render: (i) => i.description },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (i) => (
                  <>
                    <button type="button" onClick={() => openEdit(i)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(i)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedIncidents}
            getRowKey={(i) => i.id}
            emptyMessage="No hay incidentes registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidentList.length === 0 ? (
            <div className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              No hay incidentes registrados.
            </div>
          ) : (
            incidentList.map((i: Incident) => (
              <div key={i.id} className="rounded-[16px] shadow-sm p-5 flex flex-col" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {getVehicleFullLabel(i)}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-soft)' }}>{getUserLabel(i)}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(i.date)}</div>
                <div className="mt-2">
                  <span className={`badge ${STATUS_BADGE[i.status] ?? 'badge-slate'}`}>
                    {STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status}
                  </span>
                </div>
                <p className="text-sm mt-2 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>{i.description}</p>
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(i)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(i)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <IncidentFormModal
          incident={editingIncident}
          vehicles={vehicles}
          users={users}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            notifySuccess('Incidente guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message="¿Eliminar este incidente?"
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

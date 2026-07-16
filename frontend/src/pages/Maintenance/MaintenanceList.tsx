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
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type Vehicle = { id: string; plate: string; brand: string; model: string };

type Maintenance = {
  id: string;
  vehicleId: string;
  scheduledDate: string;
  type?: string;
  description?: string;
  status: string;
  odometerAtService?: number;
  vehicle?: Vehicle;
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programado' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'badge-blue',
  in_progress: 'badge-amber',
  completed: 'badge-green',
  cancelled: 'badge-slate',
};

function MaintenanceFormModal({
  maintenance,
  vehicles,
  onClose,
  onSuccess,
}: {
  maintenance: Maintenance | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: maintenance?.vehicleId ?? '',
    scheduledDate: maintenance?.scheduledDate ? maintenance.scheduledDate.slice(0, 10) : '',
    type: maintenance?.type ?? '',
    description: maintenance?.description ?? '',
    status: maintenance?.status ?? 'scheduled',
    odometerAtService: maintenance?.odometerAtService ?? '',
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
        scheduledDate: form.scheduledDate,
        type: form.type.trim() || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
        odometerAtService: form.odometerAtService === '' ? undefined : Number(form.odometerAtService),
      };
      if (maintenance) {
        await apiClient.put(`/maintenance/${maintenance.id}`, payload);
      } else {
        await apiClient.post('/maintenance', payload);
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
            {maintenance ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Fecha programada *</label>
            <input
              type="date"
              required
              value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Tipo</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Ej. Preventivo, Correctivo"
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
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Kilometraje al servicio (km)</label>
            <input
              type="number"
              min="0"
              value={form.odometerAtService}
              onChange={(e) => setForm((f) => ({ ...f, odometerAtService: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Descripción</label>
            <textarea
              rows={3}
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
              {submitting ? 'Guardando...' : maintenance ? 'Guardar cambios' : 'Crear mantenimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MaintenanceList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('maintenanceView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Maintenance | null>(null);

  const { data: maintenanceList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['maintenance', filterVehicleId || undefined, filterStatus || undefined],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterVehicleId) params.vehicleId = filterVehicleId;
      if (filterStatus) params.status = filterStatus;
      const res = await apiClient.get('/maintenance', { params });
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/maintenance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      notifySuccess('Mantenimiento eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el mantenimiento.'),
  });

  const openCreate = () => {
    setEditingMaintenance(null);
    setModalOpen(true);
  };

  const openEdit = (m: Maintenance) => {
    setEditingMaintenance(m);
    setModalOpen(true);
  };

  const handleDelete = (m: Maintenance) => {
    setDeleteTarget(m);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const getVehicleLabel = (m: Maintenance) => {
    const v = m.vehicle ?? vehicles.find((x: Vehicle) => x.id === m.vehicleId);
    return v ? `${v.plate} — ${v.brand} ${v.model}` : '—';
  };

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedMaintenance,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<Maintenance>(maintenanceList, {
    pageSize: 25,
    searchFields: (m) => [getVehicleLabel(m), m.type ?? '', m.description ?? ''],
  });

  const exportHeaders = ['Vehículo', 'Fecha', 'Tipo', 'Estado'];
  const getExportRows = (list: Maintenance[]) =>
    list.map((m) => [
      getVehicleLabel(m),
      formatDate(m.scheduledDate),
      m.type ?? '—',
      STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status,
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando mantenimientos...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="mantenimientos"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Mantenimientos</h2>
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
          <ViewToggle value={view} onChange={setView} storageKey="maintenanceView" />
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Programar servicio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card blue">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'scheduled').length}
          </span>
          <div className="stat-card__label">Programados</div>
        </div>
        <div className="stat-card amber">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'in_progress').length}
          </span>
          <div className="stat-card__label">En progreso</div>
        </div>
        <div className="stat-card green">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'completed').length}
          </span>
          <div className="stat-card__label">Completados</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'cancelled').length}
          </span>
          <div className="stat-card__label">Cancelados</div>
        </div>
      </div>

      {view === 'table' && (
        <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por vehículo, tipo o descripción..."
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(maintenanceList), 'mantenimientos.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(maintenanceList), 'mantenimientos.xlsx', 'Mantenimientos')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(maintenanceList), 'mantenimientos.pdf', 'Mantenimientos')}
          />
          <DataTable<Maintenance>
            columns={[
              { key: 'vehicle', header: 'Vehículo', sortAccessor: (m) => getVehicleLabel(m), cellClassName: 'font-medium', render: (m) => getVehicleLabel(m) },
              { key: 'scheduledDate', header: 'Fecha', sortAccessor: (m) => m.scheduledDate, render: (m) => formatDate(m.scheduledDate) },
              { key: 'type', header: 'Tipo', sortAccessor: (m) => m.type ?? '', render: (m) => m.type ?? '—' },
              {
                key: 'status',
                header: 'Estado',
                render: (m) => (
                  <span className={`badge ${STATUS_BADGE[m.status] ?? 'badge-slate'}`}>
                    {STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (m) => (
                  <>
                    <button type="button" onClick={() => openEdit(m)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(m)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedMaintenance}
            getRowKey={(m) => m.id}
            emptyMessage="No hay mantenimientos registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {maintenanceList.length === 0 ? (
            <div className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              No hay mantenimientos registrados.
            </div>
          ) : (
            maintenanceList.map((m: Maintenance) => (
              <div key={m.id} className="rounded-[16px] shadow-sm p-5 flex flex-col" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {getVehicleLabel(m)}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-soft)' }}>{formatDate(m.scheduledDate)}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{m.type ?? '—'}</div>
                <div className="mt-2">
                  <span className={`badge ${STATUS_BADGE[m.status] ?? 'badge-slate'}`}>
                    {STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status}
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{m.description}</p>
                )}
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(m)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(m)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <MaintenanceFormModal
          maintenance={editingMaintenance}
          vehicles={vehicles}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            notifySuccess('Mantenimiento guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message="¿Eliminar este mantenimiento programado?"
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { getStoredView, type ViewMode } from '../../components/ui/viewMode';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type Vehicle = { id: string; plate: string; brand: string; model: string };

type FuelRecord = {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost?: number | null;
  odometer?: number | null;
  vehicle?: Vehicle;
};

function FuelRecordFormModal({
  record,
  vehicles,
  onClose,
  onSuccess,
}: {
  record: FuelRecord | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: record?.vehicleId ?? '',
    date: record?.date ? String(record.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    liters: record?.liters ?? '',
    cost: record?.cost ?? '',
    odometer: record?.odometer ?? '',
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
        date: form.date,
        liters: Number(form.liters),
        cost: form.cost === '' ? undefined : Number(form.cost),
        odometer: form.odometer === '' ? undefined : Number(form.odometer),
      };
      if (record) {
        await apiClient.put(`/fuel-records/${record.id}`, payload);
      } else {
        await apiClient.post('/fuel-records', payload);
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
            {record ? 'Editar registro de combustible' : 'Nuevo registro de combustible'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{error}</div>}
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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Fecha *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Litros *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.liters}
                onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Costo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Kilometraje (km)</label>
            <input
              type="number"
              min="0"
              value={form.odometer}
              onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Guardando...' : record ? 'Guardar cambios' : 'Crear registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FuelRecordsList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('fuelRecordsView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FuelRecord | null>(null);

  const { data: records = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['fuel-records', filterVehicleId || undefined],
    queryFn: async () => {
      const params = filterVehicleId ? { vehicleId: filterVehicleId } : {};
      const res = await apiClient.get('/fuel-records', { params });
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

  const filteredByDate = records.filter((r: FuelRecord) => {
    const d = String(r.date).slice(0, 10);
    if (filterStartDate && d < filterStartDate) return false;
    if (filterEndDate && d > filterEndDate) return false;
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/fuel-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      notifySuccess('Registro de combustible eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el registro de combustible.'),
  });

  const openCreate = () => { setEditingRecord(null); setModalOpen(true); };
  const openEdit = (r: FuelRecord) => { setEditingRecord(r); setModalOpen(true); };
  const handleDelete = (r: FuelRecord) => {
    setDeleteTarget(r);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatNum = (n: number | null | undefined) => (n != null ? Number(n).toLocaleString('es-MX') : '—');
  const getVehicleLabel = (r: FuelRecord) => {
    const v = r.vehicle ?? vehicles.find((x: Vehicle) => x.id === r.vehicleId);
    return v ? `${v.plate} — ${v.brand} ${v.model}` : '—';
  };

  const now = new Date();
  const monthRecords = records.filter((r: FuelRecord) => {
    const d = new Date(r.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const totalLitersMonth = monthRecords.reduce((sum: number, r: FuelRecord) => sum + Number(r.liters || 0), 0);
  const totalCostMonth = monthRecords.reduce((sum: number, r: FuelRecord) => sum + Number(r.cost || 0), 0);
  const avgKmPerLiter = (() => {
    const byVehicle = new Map<string, FuelRecord[]>();
    monthRecords
      .filter((r: FuelRecord) => r.odometer != null)
      .forEach((r: FuelRecord) => {
        const list = byVehicle.get(r.vehicleId) ?? [];
        list.push(r);
        byVehicle.set(r.vehicleId, list);
      });
    let totalKm = 0;
    let totalLitersUsed = 0;
    byVehicle.forEach((list) => {
      const sorted = [...list].sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));
      for (let i = 1; i < sorted.length; i++) {
        const km = (sorted[i].odometer ?? 0) - (sorted[i - 1].odometer ?? 0);
        if (km > 0) {
          totalKm += km;
          totalLitersUsed += Number(sorted[i].liters || 0);
        }
      }
    });
    return totalLitersUsed > 0 ? totalKm / totalLitersUsed : null;
  })();

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedRecords,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<FuelRecord>(filteredByDate, {
    pageSize: 25,
    searchFields: (r) => [getVehicleLabel(r)],
  });

  const exportHeaders = ['Vehículo', 'Fecha', 'Litros', 'Costo', 'Kilometraje (km)'];
  const getExportRows = (list: FuelRecord[]) => list.map((r) => [getVehicleLabel(r), formatDate(r.date), formatNum(r.liters), r.cost != null ? formatNum(r.cost) : '—', formatNum(r.odometer)]);

  if (isLoading) return <div className="text-primary font-bold">Cargando registros de combustible...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="registros de combustible"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Registros de combustible</h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los vehículos' }, ...vehicles.map((v: Vehicle) => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }))]}
            value={filterVehicleId}
            onChange={setFilterVehicleId}
            placeholder="Todos los vehículos"
            className="w-48"
          />
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <ViewToggle value={view} onChange={setView} storageKey="fuelRecordsView" />
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Registrar carga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card blue">
          <span className="stat-card__value">{formatNum(totalLitersMonth)} L</span>
          <div className="stat-card__label">Litros este mes</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">${formatNum(totalCostMonth)}</span>
          <div className="stat-card__label">Gasto este mes</div>
        </div>
        <div className="stat-card green">
          <span className="stat-card__value">
            {avgKmPerLiter == null ? '—' : `${avgKmPerLiter.toFixed(1)} km/L`}
          </span>
          <div className="stat-card__label">Rendimiento promedio</div>
        </div>
      </div>

      {view === 'table' && (
        <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por vehículo..."
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredByDate), 'registros-combustible.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredByDate), 'registros-combustible.xlsx', 'Registros combustible')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredByDate), 'registros-combustible.pdf', 'Registros combustible')}
          />
          <DataTable<FuelRecord>
            columns={[
              { key: 'vehicle', header: 'Vehículo', sortAccessor: (r) => getVehicleLabel(r), cellClassName: 'font-medium', render: (r) => getVehicleLabel(r) },
              { key: 'date', header: 'Fecha', sortAccessor: (r) => r.date, render: (r) => formatDate(r.date) },
              { key: 'liters', header: 'Litros', align: 'right', sortAccessor: (r) => r.liters, render: (r) => formatNum(r.liters) },
              { key: 'cost', header: 'Costo', align: 'right', sortAccessor: (r) => r.cost ?? 0, render: (r) => (r.cost != null ? formatNum(r.cost) : '—') },
              { key: 'odometer', header: 'Kilometraje', align: 'right', sortAccessor: (r) => r.odometer ?? 0, render: (r) => formatNum(r.odometer) },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (r) => (
                  <>
                    <button type="button" onClick={() => openEdit(r)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(r)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedRecords}
            getRowKey={(r) => r.id}
            emptyMessage="No hay registros de combustible."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredByDate.length === 0 ? (
            <div className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>No hay registros de combustible.</div>
          ) : (
            filteredByDate.map((r: FuelRecord) => (
              <div key={r.id} className="rounded-[16px] shadow-sm p-5 flex flex-col" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>{getVehicleLabel(r)}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-soft)' }}>{formatDate(r.date)}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-soft)' }}>{formatNum(r.liters)} L</div>
                {r.cost != null && <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Costo: {formatNum(r.cost)}</div>}
                {r.odometer != null && <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Kilometraje: {formatNum(r.odometer)} km</div>}
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(r)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(r)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <FuelRecordFormModal
          record={editingRecord}
          vehicles={vehicles}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
            notifySuccess('Registro de combustible guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message="¿Eliminar este registro de combustible?"
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

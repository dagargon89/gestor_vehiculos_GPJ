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
import { Modal } from '../../components/ui/Modal';

type Vehicle = { id: string; plate: string; brand: string; model: string };

type Cost = {
  id: string;
  vehicleId: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  vehicle?: Vehicle;
};

const CATEGORY_OPTIONS = [
  { value: 'combustible', label: 'Combustible' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'tenencia', label: 'Tenencia / Verificación' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'refaccion', label: 'Refacción' },
  { value: 'otro', label: 'Otro' },
];

function categoryLabel(cat: string) {
  return CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;
}

function CostFormModal({
  cost,
  vehicles,
  onClose,
  onSuccess,
}: {
  cost: Cost | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: cost?.vehicleId ?? '',
    category: cost?.category ?? '',
    amount: cost?.amount ?? '',
    date: cost?.date ? String(cost.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    description: cost?.description ?? '',
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
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        description: form.description.trim() || undefined,
      };
      if (cost) {
        await apiClient.put(`/costs/${cost.id}`, payload);
      } else {
        await apiClient.post('/costs', payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Error al guardar';
      setError(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={cost ? 'Editar gasto' : 'Registrar gasto'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Vehículo *</label>
            <SearchSelect
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.plate} — ${v.brand} ${v.model}`,
              }))}
              value={form.vehicleId}
              onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))}
              placeholder="Seleccionar..."
              required
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>
              Categoría *
            </label>
            <SearchSelect
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              placeholder="Seleccionar categoría..."
              required
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>
                Monto (MXN) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Fecha *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input-field w-full resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : cost ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
      </form>
    </Modal>
  );
}

const EXPORT_HEADERS = ['Fecha', 'Vehículo', 'Categoría', 'Monto (MXN)', 'Descripción'];

export function CostsList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(getStoredView('costsView'));
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cost | null>(null);

  const { data: costs = [], isLoading, isError, error, refetch } = useQuery<Cost[]>({
    queryKey: ['costs'],
    queryFn: async () => (await apiClient.get('/costs')).data,
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => (await apiClient.get('/vehicles')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/costs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      notifySuccess('Gasto eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el gasto.'),
  });

  const handleDelete = (c: Cost) => {
    setDeleteTarget(c);
  };

  const openNew = () => { setEditingCost(null); setModalOpen(true); };
  const openEdit = (c: Cost) => { setEditingCost(c); setModalOpen(true); };

  const filteredBase = costs.filter((c) => {
    if (filterVehicle && c.vehicleId !== filterVehicle) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    return true;
  });

  const costSearchFields = (c: Cost) => [c.vehicle?.plate ?? '', categoryLabel(c.category), c.description ?? ''];

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedCosts,
    filteredData: filtered,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<Cost>(filteredBase, {
    pageSize: 25,
    searchFields: costSearchFields,
  });

  const totalAmount = filtered.reduce((acc, c) => acc + Number(c.amount), 0);
  const fmtCurrency = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const getExportRows = (list: Cost[]) =>
    list.map((c) => [
      String(c.date).slice(0, 10),
      c.vehicle ? `${c.vehicle.plate} ${c.vehicle.brand} ${c.vehicle.model}` : c.vehicleId,
      categoryLabel(c.category),
      Number(c.amount).toFixed(2),
      c.description ?? '',
    ]);

  if (isError) {
    return (
      <QueryErrorState
        title="gastos"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold"
            style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}
          >
            Costos y Gastos
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Gestión de gastos operativos de la flota.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <span className="material-icons text-base">add</span>
          Registrar gasto
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Total registros
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
            {filtered.length}
          </p>
        </div>
        <div className="glass-panel p-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Total gastos (filtrado)
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
            {fmtCurrency(totalAmount)}
          </p>
        </div>
        <div className="glass-panel p-4 col-span-2 sm:col-span-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Promedio por registro
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
            {filtered.length > 0 ? fmtCurrency(totalAmount / filtered.length) : '—'}
          </p>
        </div>
      </div>

      {/* Filtros y tabla */}
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >
        {/* Barra de filtros */}
        <div
          className="px-4 py-3 flex flex-wrap gap-3 items-center"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vehículo, categoría..."
            className="input-field w-64"
          />
          <SearchSelect
            options={[
              { value: '', label: 'Todos los vehículos' },
              ...vehicles.map((v) => ({
                value: v.id,
                label: `${v.plate} — ${v.brand} ${v.model}`,
              })),
            ]}
            value={filterVehicle}
            onChange={setFilterVehicle}
            placeholder="Vehículo"
            className="w-48"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todas las categorías' }, ...CATEGORY_OPTIONS]}
            value={filterCategory}
            onChange={setFilterCategory}
            placeholder="Categoría"
            className="w-44"
          />
          <div className="ml-auto">
            <ViewToggle value={view} onChange={setView} storageKey="costsView" />
          </div>
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
          onExportCSV={() => exportToCSV(EXPORT_HEADERS, getExportRows(filtered), 'costos.csv')}
          onExportExcel={() =>
            exportToExcel(EXPORT_HEADERS, getExportRows(filtered), 'costos.xlsx', 'Costos')
          }
          onExportPDF={() =>
            exportToPDF(EXPORT_HEADERS, getExportRows(filtered), 'costos.pdf', 'Costos y Gastos')
          }
        />

        {/* Vista tabla */}
        {view === 'table' && (
          <DataTable<Cost>
            columns={[
              { key: 'date', header: 'Fecha', align: 'left', sortAccessor: (c) => String(c.date).slice(0, 10), cellClassName: 'font-mono-data text-sm', render: (c) => String(c.date).slice(0, 10) },
              {
                key: 'vehicle',
                header: 'Vehículo',
                sortAccessor: (c) => c.vehicle?.plate ?? c.vehicleId,
                cellClassName: 'font-medium',
                render: (c) => (c.vehicle ? `${c.vehicle.plate} — ${c.vehicle.brand} ${c.vehicle.model}` : c.vehicleId),
              },
              {
                key: 'category',
                header: 'Categoría',
                sortAccessor: (c) => categoryLabel(c.category),
                render: (c) => (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {categoryLabel(c.category)}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Monto',
                align: 'right',
                sortAccessor: (c) => Number(c.amount),
                cellClassName: 'font-mono-data font-semibold text-slate-900',
                render: (c) => fmtCurrency(Number(c.amount)),
              },
              {
                key: 'description',
                header: 'Descripción',
                cellClassName: 'text-slate-500 text-sm max-w-xs truncate',
                render: (c) => <span title={c.description}>{c.description || '—'}</span>,
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (c) => (
                  <>
                    <button type="button" onClick={() => openEdit(c)} className="text-primary font-medium hover:underline mr-3 text-sm">Editar</button>
                    <button type="button" onClick={() => handleDelete(c)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedCosts}
            getRowKey={(c) => c.id}
            emptyMessage={isLoading ? 'Cargando...' : 'No hay gastos registrados.'}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        )}

        {/* Vista tarjetas */}
        {view === 'cards' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
            ) : paginatedCosts.length === 0 ? (
              <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                No hay gastos registrados.
              </div>
            ) : (
              paginatedCosts.map((c: Cost) => (
                <div
                  key={c.id}
                  className="rounded-[14px] p-5 flex flex-col gap-2 shadow-sm"
                  style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {c.vehicle
                          ? `${c.vehicle.plate} — ${c.vehicle.brand} ${c.vehicle.model}`
                          : c.vehicleId}
                      </p>
                      <p className="text-xs mt-0.5 font-mono-data" style={{ color: 'var(--color-text-muted)' }}>
                        {String(c.date).slice(0, 10)}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary whitespace-nowrap">
                      {categoryLabel(c.category)}
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-mono-data" style={{ color: 'var(--color-primary)' }}>
                    {fmtCurrency(Number(c.amount))}
                  </p>
                  {c.description && (
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{c.description}</p>
                  )}
                  <div className="flex gap-3 pt-2 mt-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-primary font-medium hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="text-red-600 font-medium hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <CostFormModal
          cost={editingCost}
          vehicles={vehicles}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['costs'] });
            notifySuccess('Gasto guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar el gasto "${categoryLabel(deleteTarget.category)} — ${deleteTarget.vehicle?.plate ?? deleteTarget.vehicleId}"?`}
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

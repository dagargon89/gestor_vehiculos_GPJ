import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';

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
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {record ? 'Editar registro de combustible' : 'Nuevo registro de combustible'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehículo *</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Litros *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.liters}
                onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Costo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Odómetro (km)</label>
            <input
              type="number"
              min="0"
              value={form.odometer}
              onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">
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

  const { data: records = [], isLoading } = useQuery({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fuel-records'] }),
  });

  const openCreate = () => { setEditingRecord(null); setModalOpen(true); };
  const openEdit = (r: FuelRecord) => { setEditingRecord(r); setModalOpen(true); };
  const handleDelete = (r: FuelRecord) => {
    if (!window.confirm('¿Eliminar este registro de combustible?')) return;
    deleteMutation.mutate(r.id);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatNum = (n: number | null | undefined) => (n != null ? Number(n).toLocaleString('es-MX') : '—');
  const getVehicleLabel = (r: FuelRecord) => {
    const v = r.vehicle ?? vehicles.find((x: Vehicle) => x.id === r.vehicleId);
    return v ? `${v.plate} — ${v.brand} ${v.model}` : '—';
  };

  const { paginatedData: paginatedRecords, page, setPage, pageSize, setPageSize, totalItems, totalPages, startIndex, endIndex, PAGE_SIZE_OPTIONS } = usePagination<FuelRecord>(filteredByDate, { pageSize: 25 });

  const exportHeaders = ['Vehículo', 'Fecha', 'Litros', 'Costo', 'Odómetro (km)'];
  const getExportRows = (list: FuelRecord[]) => list.map((r) => [getVehicleLabel(r), formatDate(r.date), formatNum(r.liters), r.cost != null ? formatNum(r.cost) : '—', formatNum(r.odometer)]);

  if (isLoading) return <div className="text-primary font-bold">Cargando registros de combustible...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Registros de combustible</h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los vehículos' }, ...vehicles.map((v: Vehicle) => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }))]}
            value={filterVehicleId}
            onChange={setFilterVehicleId}
            placeholder="Todos los vehículos"
            className="w-48"
          />
          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <ViewToggle value={view} onChange={setView} storageKey="fuelRecordsView" />
          <button type="button" onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Nuevo registro</button>
        </div>
      </div>

      {view === 'table' && (
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredByDate), 'registros-combustible.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredByDate), 'registros-combustible.xlsx', 'Registros combustible')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredByDate), 'registros-combustible.pdf', 'Registros combustible')}
          />
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Vehículo</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fecha</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Litros</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Costo</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Odómetro</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay registros de combustible.</td></tr>
              ) : (
                paginatedRecords.map((r: FuelRecord) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{getVehicleLabel(r)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatNum(r.liters)}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{r.cost != null ? formatNum(r.cost) : '—'}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatNum(r.odometer)}</td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => openEdit(r)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(r)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredByDate.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">No hay registros de combustible.</div>
          ) : (
            filteredByDate.map((r: FuelRecord) => (
              <div key={r.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="font-medium text-slate-900">{getVehicleLabel(r)}</div>
                <div className="text-slate-600 text-sm mt-1">{formatDate(r.date)}</div>
                <div className="text-slate-600 text-sm mt-0.5">{formatNum(r.liters)} L</div>
                {r.cost != null && <div className="text-slate-500 text-sm">Costo: {formatNum(r.cost)}</div>}
                {r.odometer != null && <div className="text-slate-500 text-sm">Odómetro: {formatNum(r.odometer)} km</div>}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
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
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['fuel-records'] })}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';

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
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {maintenance ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
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
              <option value="">Seleccionar...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha programada *</label>
            <input
              type="date"
              required
              value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Ej. Preventivo, Correctivo"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Odómetro al servicio (km)</label>
            <input
              type="number"
              min="0"
              value={form.odometerAtService}
              onChange={(e) => setForm((f) => ({ ...f, odometerAtService: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
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

  const { data: maintenanceList = [], isLoading } = useQuery({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
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
    if (!window.confirm(`¿Eliminar este mantenimiento programado?`)) return;
    deleteMutation.mutate(m.id);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  if (isLoading) return <div className="text-primary font-bold">Cargando mantenimientos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Mantenimientos</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los vehículos</option>
            {vehicles.map((v: Vehicle) => (
              <option key={v.id} value={v.id}>{v.plate}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ViewToggle value={view} onChange={setView} storageKey="maintenanceView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo mantenimiento
          </button>
        </div>
      </div>

      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Vehículo</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fecha</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Tipo</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay mantenimientos registrados.</td>
                </tr>
              ) : (
                maintenanceList.map((m: Maintenance) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {m.vehicle ? `${m.vehicle.plate} — ${m.vehicle.brand} ${m.vehicle.model}` : m.vehicleId}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(m.scheduledDate)}</td>
                    <td className="px-6 py-4 text-slate-600">{m.type ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => openEdit(m)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(m)} className="text-red-600 font-medium hover:underline">Eliminar</button>
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
          {maintenanceList.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay mantenimientos registrados.
            </div>
          ) : (
            maintenanceList.map((m: Maintenance) => (
              <div key={m.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="font-medium text-slate-900">
                  {m.vehicle ? `${m.vehicle.plate} — ${m.vehicle.brand} ${m.vehicle.model}` : m.vehicleId}
                </div>
                <div className="text-slate-600 text-sm mt-1">{formatDate(m.scheduledDate)}</div>
                <div className="text-slate-500 text-sm mt-0.5">{m.type ?? '—'}</div>
                <div className="mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status}
                  </span>
                </div>
                {m.description && (
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2">{m.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
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
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['maintenance'] })}
        />
      )}
    </div>
  );
}

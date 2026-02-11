import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';

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
  const [form, setForm] = useState({
    vehicleId: incident?.vehicleId ?? '',
    userId: incident?.userId ?? '',
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
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {incident ? 'Editar incidente' : 'Nuevo incidente'}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario (opcional)</label>
            <select
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Ninguno</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.displayName || u.email || u.id}</option>
              ))}
            </select>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
            <textarea
              rows={3}
              required
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

  const { data: incidentList = [], isLoading } = useQuery({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
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
    if (!window.confirm('¿Eliminar este incidente?')) return;
    deleteMutation.mutate(i.id);
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

  if (isLoading) return <div className="text-primary font-bold">Cargando incidentes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Incidentes</h2>
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
          <ViewToggle value={view} onChange={setView} storageKey="incidentView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo incidente
          </button>
        </div>
      </div>

      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Vehículo</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuario</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fecha</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Descripción</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay incidentes registrados.</td>
                </tr>
              ) : (
                incidentList.map((i: Incident) => (
                  <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {getVehicleLabel(i)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getUserLabel(i)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(i.date)}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{i.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => openEdit(i)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(i)} className="text-red-600 font-medium hover:underline">Eliminar</button>
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
          {incidentList.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay incidentes registrados.
            </div>
          ) : (
            incidentList.map((i: Incident) => (
              <div key={i.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="font-medium text-slate-900">
                  {getVehicleFullLabel(i)}
                </div>
                <div className="text-slate-600 text-sm mt-1">{getUserLabel(i)}</div>
                <div className="text-slate-500 text-sm mt-0.5">{formatDate(i.date)}</div>
                <div className="mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-2 line-clamp-3">{i.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
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
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['incidents'] })}
        />
      )}
    </div>
  );
}

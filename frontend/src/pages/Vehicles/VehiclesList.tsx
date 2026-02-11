import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  vin?: string;
  photoUrls?: string | null;
  status: string;
  currentOdometer?: number;
};

function getFirstPhotoUrl(photoUrls: string | null | undefined): string | null {
  if (!photoUrls || !photoUrls.trim()) return null;
  try {
    const parsed = JSON.parse(photoUrls) as string[];
    return Array.isArray(parsed) && parsed[0] ? parsed[0] : null;
  } catch {
    const first = photoUrls.split(',')[0]?.trim();
    return first || null;
  }
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'in_use', label: 'En uso' },
  { value: 'maintenance', label: 'Mantenimiento' },
];

function VehicleFormModal({
  vehicle,
  onClose,
  onSuccess,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    plate: vehicle?.plate ?? '',
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? '',
    color: vehicle?.color ?? '',
    vin: vehicle?.vin ?? '',
    status: vehicle?.status ?? 'available',
    currentOdometer: vehicle?.currentOdometer ?? '',
  });
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const uploadVehiclePhoto = async (vehicleId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('photo', file);
    await apiClient.post(`/vehicles/${vehicleId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        plate: form.plate.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year === '' ? undefined : Number(form.year),
        color: form.color.trim() || undefined,
        vin: form.vin.trim() || undefined,
        status: form.status,
        currentOdometer: form.currentOdometer === '' ? undefined : Number(form.currentOdometer),
      };
      let vehicleId: string;
      if (vehicle) {
        await apiClient.put(`/vehicles/${vehicle.id}`, payload);
        vehicleId = vehicle.id;
      } else {
        const { data: created } = await apiClient.post<{ id: string }>('/vehicles', payload);
        vehicleId = created.id;
      }
      for (const file of pendingPhotos) {
        await uploadVehiclePhoto(vehicleId, file);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const isNetworkError = !ax?.response;
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const message = isNetworkError
        ? `Error de red (${ax?.message ?? 'sin conexión'}). Comprueba que el backend esté en marcha y que la URL del API sea correcta. Comprobando: ${baseURL}`
        : (ax.response?.data?.message ?? 'Error al guardar');
      setError(message);
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
            {vehicle ? 'Editar vehículo' : 'Nuevo vehículo'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
            <input
              type="text"
              required
              value={form.plate}
              onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
              <input
                type="number"
                min="1990"
                max="2030"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">VIN</label>
            <input
              type="text"
              value={form.vin}
              onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto(s) del vehículo</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPendingPhotos((prev) => [...prev, ...files]);
                e.target.value = '';
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {pendingPhotos.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {pendingPhotos.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-red-600 hover:underline shrink-0"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {vehicle?.photoUrls && (
              <p className="mt-1 text-xs text-slate-500">
                El vehículo ya tiene fotos. Las que subas aquí se añadirán.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Odómetro (km)</label>
              <input
                type="number"
                min="0"
                value={form.currentOdometer}
                onChange={(e) => setForm((f) => ({ ...f, currentOdometer: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
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
              {submitting ? 'Guardando...' : vehicle ? 'Guardar cambios' : 'Crear vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VehiclesList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('vehiclesView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vehicles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const openCreate = () => {
    setEditingVehicle(null);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setModalOpen(true);
  };

  const handleDelete = (v: Vehicle) => {
    if (!window.confirm(`¿Eliminar el vehículo ${v.plate} (${v.brand} ${v.model})?`)) return;
    deleteMutation.mutate(v.id);
  };

  if (isLoading) return <div className="text-primary font-bold">Cargando vehículos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Vehículos</h2>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} storageKey="vehiclesView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo vehículo
          </button>
        </div>
      </div>
      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Placa</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Marca</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Modelo</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay vehículos registrados.</td>
                </tr>
              ) : (
                vehicles.map((v: Vehicle) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{v.plate}</td>
                    <td className="px-6 py-4 text-slate-600">{v.brand}</td>
                    <td className="px-6 py-4 text-slate-600">{v.model}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(v)}
                        className="text-primary font-medium hover:underline mr-3"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
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
      )}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay vehículos registrados.
            </div>
          ) : (
            vehicles.map((v: Vehicle) => {
              const photoUrl = getFirstPhotoUrl(v.photoUrls);
              const statusLabel = STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status;
              const statusBadgeClass =
                v.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : v.status === 'in_use'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700';
              return (
                <div
                  key={v.id}
                  className="bg-slate-50 rounded-[16px] shadow-sm border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-200 relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${v.plate} ${v.brand} ${v.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="material-icons text-6xl">directions_car</span>
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium ${statusBadgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="font-bold text-slate-900 text-xl">{v.plate}</div>
                    <div className="text-slate-600 text-sm mt-0.5">
                      {v.brand} {v.model}
                      {v.year != null && ` (${v.year})`}
                    </div>
                    {v.color && (
                      <div className="text-slate-600 text-sm">{v.color}</div>
                    )}
                    {v.currentOdometer != null && (
                      <div className="text-slate-600 text-sm">
                        Odómetro: {v.currentOdometer.toLocaleString()} km
                      </div>
                    )}
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(v)}
                        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
                        className="text-red-600 font-medium hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {modalOpen && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => setModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { ImageCropModal } from '../../components/ui/ImageCropModal';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';

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
  lastFuelLevel?: string | null;
  lastUsedByUser?: string | null;
};

function parsePhotoUrls(photoUrls: string | null | undefined): string[] {
  if (!photoUrls || !photoUrls.trim()) return [];
  try {
    const parsed = JSON.parse(photoUrls);
    if (Array.isArray(parsed)) return parsed.filter((u: string) => u && u.trim());
  } catch { /* not JSON */ }
  return photoUrls.split(',').map((u) => u.trim()).filter(Boolean);
}

function getFirstPhotoUrl(photoUrls: string | null | undefined): string | null {
  const urls = parsePhotoUrls(photoUrls);
  return urls[0] ?? null;
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
  const [existingPhotos, setExistingPhotos] = useState<string[]>(() =>
    parsePhotoUrls(vehicle?.photoUrls),
  );
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('');
  const [cropExistingIndex, setCropExistingIndex] = useState<number | null>(null);
  const [fetchingExisting, setFetchingExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => { pendingPreviews.forEach(URL.revokeObjectURL); };
  }, [pendingPreviews]);

  // Process crop queue: show modal for next new file
  useEffect(() => {
    if (cropQueue.length > 0 && !cropSrc) {
      const next = cropQueue[0];
      setCropFileName(next.name);
      setCropExistingIndex(null);
      setCropSrc(URL.createObjectURL(next));
    }
  }, [cropQueue, cropSrc]);

  const handleEditExisting = async (i: number) => {
    setFetchingExisting(true);
    try {
      const res = await fetch(existingPhotos[i]);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setCropFileName(`foto_${i + 1}.jpg`);
      setCropExistingIndex(i);
      setCropSrc(objectUrl);
    } catch {
      setError('No se pudo cargar la foto para editar. Revisa la conexión.');
    } finally {
      setFetchingExisting(false);
    }
  };

  const handleCropConfirm = (croppedFile: File) => {
    const preview = URL.createObjectURL(croppedFile);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    if (cropExistingIndex !== null) {
      // Replace existing: remove old URL, add cropped file to pending
      setExistingPhotos((prev) => prev.filter((_, idx) => idx !== cropExistingIndex));
      setCropExistingIndex(null);
    } else {
      // New from queue
      setCropQueue((prev) => prev.slice(1));
    }
    setPendingPhotos((prev) => [...prev, croppedFile]);
    setPendingPreviews((prev) => [...prev, preview]);
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropExistingIndex(null);
    setCropQueue((prev) => (cropExistingIndex !== null ? prev : prev.slice(1)));
  };

  const removePending = (i: number) => {
    URL.revokeObjectURL(pendingPreviews[i]);
    setPendingPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPendingPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

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
      const payload: Record<string, unknown> = {
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
        const originalPhotos = parsePhotoUrls(vehicle.photoUrls);
        const photosChanged =
          originalPhotos.length !== existingPhotos.length ||
          originalPhotos.some((u, i) => u !== existingPhotos[i]);
        if (photosChanged) {
          payload.photoUrls = existingPhotos.join(',');
        }
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
        className="rounded-[16px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {vehicle ? 'Editar vehículo' : 'Nuevo vehículo'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Placa *</label>
            <input
              type="text"
              required
              value={form.plate}
              onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Marca *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Modelo *</label>
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Año</label>
              <input
                type="number"
                min="1990"
                max="2030"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>VIN</label>
            <input
              type="text"
              value={form.vin}
              onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>
              Foto(s) del vehículo
            </label>

            {/* Existing photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Fotos actuales (X para eliminar):
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((url, i) => (
                    <div
                      key={url}
                      className="relative w-20 h-20 rounded-lg overflow-hidden group"
                      style={{ border: '1px solid var(--color-border)' }}
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.55)' }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEditExisting(i)}
                          disabled={fetchingExisting}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(99,132,255,0.85)', color: '#fff' }}
                          title="Recortar foto"
                        >
                          {fetchingExisting ? (
                            <span className="material-icons animate-spin" style={{ fontSize: 14 }}>refresh</span>
                          ) : (
                            <span className="material-icons" style={{ fontSize: 14 }}>crop</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExistingPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(220,38,38,0.85)', color: '#fff' }}
                          title="Eliminar foto"
                        >
                          <span className="material-icons" style={{ fontSize: 14 }}>delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending (cropped) photos */}
            {pendingPhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Fotos nuevas (por subir):
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingPreviews.map((src, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-[60px] rounded-lg overflow-hidden"
                      style={{ border: '1px solid var(--color-border)' }}
                    >
                      <img src={src} alt={`Nueva ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePending(i)}
                        className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-bl-lg"
                        style={{ background: 'rgba(220,38,38,0.90)', color: '#fff' }}
                        title="Quitar"
                      >
                        <span className="material-icons" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File input trigger */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) setCropQueue((prev) => [...prev, ...files]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full justify-center"
              style={{
                border: '2px dashed var(--color-border)',
                color: 'var(--color-text-muted)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6384ff';
                e.currentTarget.style.color = '#818cf8';
                e.currentTarget.style.background = 'rgba(99,132,255,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.color = 'var(--color-text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span className="material-icons text-xl">add_photo_alternate</span>
              Agregar foto
            </button>
          </div>

          {/* Crop modal */}
          {cropSrc && (
            <ImageCropModal
              imageSrc={cropSrc}
              fileName={cropFileName}
              title={cropExistingIndex !== null ? 'Editar foto existente' : 'Recortar foto nueva'}
              aspect={4 / 3}
              onConfirm={handleCropConfirm}
              onCancel={handleCropCancel}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Kilometraje (km)</label>
              <input
                type="number"
                min="0"
                value={form.currentOdometer}
                onChange={(e) => setForm((f) => ({ ...f, currentOdometer: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-2 disabled:opacity-50"
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
  const [filterStatus, setFilterStatus] = useState('');

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

  const filteredVehicles = filterStatus
    ? vehicles.filter((v: Vehicle) => v.status === filterStatus)
    : vehicles;

  const {
    paginatedData: paginatedVehicles,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = usePagination<Vehicle>(filteredVehicles, { pageSize: 25 });

  const exportHeaders = ['Placa', 'Marca', 'Modelo', 'Estado'];
  const getExportRows = (list: Vehicle[]) =>
    list.map((v: Vehicle) => [
      v.plate,
      v.brand,
      v.model,
      STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status,
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando vehículos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Vehículos</h2>
        <div className="flex items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos los estados"
            className="w-48"
          />
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.xlsx', 'Vehículos')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.pdf', 'Vehículos')}
          />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
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
              {paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay vehículos registrados.</td>
                </tr>
              ) : (
                paginatedVehicles.map((v: Vehicle) => (
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
                        Kilometraje: {v.currentOdometer.toLocaleString()} km
                      </div>
                    )}
                    <div className="text-slate-600 text-sm">Gasolina: {v.lastFuelLevel ?? '—'}</div>
                    <div className="text-slate-600 text-sm">Último uso: {v.lastUsedByUser ?? '—'}</div>
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

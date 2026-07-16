import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { getStoredView, type ViewMode } from '../../components/ui/viewMode';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { ImageCropModal } from '../../components/ui/ImageCropModal';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

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

// lastFuelLevel es texto libre (p. ej. "3/4", "Lleno"); solo se dibuja la barra
// de combustible del rediseño cuando el valor es un entero 0-100 plano.
function parseFuelPercent(level: string | null | undefined): number | null {
  if (!level) return null;
  const match = level.trim().match(/^(\d{1,3})\s*%?$/);
  if (!match) return null;
  const n = Number(match[1]);
  return n >= 0 && n <= 100 ? n : null;
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
      const res = await apiClient.get(`/storage/proxy?url=${encodeURIComponent(existingPhotos[i])}`, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(res.data as Blob);
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
    <Modal title={vehicle ? 'Editar vehículo' : 'Nuevo vehículo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
                          style={{ background: 'rgba(245,165,36,0.85)', color: '#fff' }}
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
                e.currentTarget.style.borderColor = '#f5a524';
                e.currentTarget.style.color = '#fbbf24';
                e.currentTarget.style.background = 'rgba(245,165,36,0.05)';
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
    </Modal>
  );
}

export function VehiclesList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('vehiclesView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      notifySuccess('Vehículo eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el vehículo.'),
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
    setDeleteTarget(v);
  };

  const filteredVehicles = filterStatus
    ? vehicles.filter((v: Vehicle) => v.status === filterStatus)
    : vehicles;

  const statusChips = [
    { value: '', label: 'Todos', count: vehicles.length },
    ...STATUS_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
      count: vehicles.filter((v: Vehicle) => v.status === o.value).length,
    })),
  ];

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
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
  } = useDataTable<Vehicle>(filteredVehicles, {
    pageSize: 25,
    searchFields: (v) => [v.plate, v.brand, v.model],
  });

  const exportHeaders = ['Placa', 'Marca', 'Modelo', 'Estado'];
  const getExportRows = (list: Vehicle[]) =>
    list.map((v: Vehicle) => [
      v.plate,
      v.brand,
      v.model,
      STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status,
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando vehículos...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="vehículos"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Vehículos</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {vehicles.length} {vehicles.length === 1 ? 'unidad' : 'unidades'} en la flota
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 px-4 py-2.5"
        >
          <span className="material-icons text-lg">add</span>
          Nuevo vehículo
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <span
            className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: 'var(--color-text-muted)' }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar placa o modelo…"
            className="input-field w-full pl-10"
          />
        </div>
        {statusChips.map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            onClick={() => setFilterStatus(chip.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={
              filterStatus === chip.value
                ? { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
                : { background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-soft)' }
            }
          >
            {chip.label}
            <span className="font-mono-data" style={{ opacity: 0.75, fontSize: 11 }}>{chip.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <ViewToggle value={view} onChange={setView} storageKey="vehiclesView" />
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
        onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.csv')}
        onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.xlsx', 'Vehículos')}
        onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.pdf', 'Vehículos')}
      />
      {view === 'table' && (
        <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <DataTable<Vehicle>
            columns={[
              { key: 'plate', header: 'Placa', sortAccessor: (v) => v.plate, cellClassName: 'font-medium', render: (v) => v.plate },
              { key: 'brand', header: 'Marca', sortAccessor: (v) => v.brand, render: (v) => v.brand },
              { key: 'model', header: 'Modelo', sortAccessor: (v) => v.model, render: (v) => v.model },
              {
                key: 'status',
                header: 'Estado',
                render: (v) => {
                  const badgeClass = v.status === 'available' ? 'badge-green' : v.status === 'in_use' ? 'badge-amber' : 'badge-slate';
                  return (
                    <span className={`badge ${badgeClass}`}>
                      {STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (v) => (
                  <>
                    <button type="button" onClick={() => openEdit(v)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(v)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedVehicles}
            getRowKey={(v) => v.id}
            emptyMessage="No hay vehículos registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}
      {view === 'cards' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {paginatedVehicles.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay vehículos registrados.
            </div>
          ) : (
            paginatedVehicles.map((v: Vehicle) => {
              const photoUrl = getFirstPhotoUrl(v.photoUrls);
              const statusLabel = STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status;
              const badgeClass = v.status === 'available' ? 'badge-green' : v.status === 'in_use' ? 'badge-amber' : 'badge-slate';
              const fuelPercent = parseFuelPercent(v.lastFuelLevel);
              return (
                <div
                  key={v.id}
                  className="rounded-[14px] overflow-hidden flex flex-col"
                  style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
                >
                  <div className="aspect-[4/3] relative" style={{ background: 'var(--color-table-head-bg)' }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${v.plate} ${v.brand} ${v.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-icons text-6xl">directions_car</span>
                      </div>
                    )}
                    <span className={`badge ${badgeClass} absolute top-2 right-2 flex items-center gap-1.5`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {statusLabel}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-3">
                      <span className="badge badge-slate font-mono-data">{v.plate}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(245,165,36,0.14)', color: 'var(--color-primary)' }}
                      >
                        <span className="material-icons">directions_car</span>
                      </span>
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {v.brand} {v.model}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {v.color ?? '—'}{v.year != null && ` · ${v.year}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--color-text-soft)' }}>
                      <span className="flex items-center gap-1.5">
                        <span className="material-icons" style={{ fontSize: 15, color: 'var(--color-text-muted)' }}>speed</span>
                        <span className="font-mono-data">{v.currentOdometer != null ? v.currentOdometer.toLocaleString() : '—'} km</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-icons" style={{ fontSize: 15, color: 'var(--color-text-muted)' }}>local_gas_station</span>
                        <span className="font-mono-data">{v.lastFuelLevel ?? '—'}{fuelPercent != null && '%'}</span>
                      </span>
                    </div>
                    {fuelPercent != null && (
                      <div className="h-[5px] rounded-full overflow-hidden mb-3" style={{ background: 'var(--color-table-head-bg)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${fuelPercent}%`,
                            background: fuelPercent > 50 ? '#34d399' : fuelPercent > 20 ? '#fbbf24' : '#f87171',
                          }}
                        />
                      </div>
                    )}
                    <div className="text-xs flex items-center gap-1.5 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="material-icons" style={{ fontSize: 15 }}>person</span>
                      {v.lastUsedByUser ?? '—'}
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(v)}
                        className="btn-primary w-full py-2.5 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#f87171' }}
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
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            notifySuccess('Vehículo guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar el vehículo ${deleteTarget.plate} (${deleteTarget.brand} ${deleteTarget.model})?`}
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

type Vehicle = { id: string; plate: string; brand: string; model: string; currentOdometer?: number };

type Reservation = {
  id: string;
  userId: string;
  vehicleId: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  eventName?: string;
  description?: string;
  destination?: string;
  checkinOdometer?: number | null;
  checkoutOdometer?: number | null;
  vehicle?: Vehicle;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activa',
  completed: 'Completada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-slate-100 text-slate-700',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-500',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReservationCard({ r }: { r: Reservation }) {
  const vehicleLabel = r.vehicle
    ? `${r.vehicle.plate} – ${r.vehicle.brand} ${r.vehicle.model}`
    : 'Vehículo';
  const statusStyle = STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">{r.eventName || 'Reserva'}</h4>
          <p className="text-sm text-slate-600 mt-0.5">{vehicleLabel}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
        <div>
          <span className="text-slate-400">Salida:</span>{' '}
          {formatDate(r.startDatetime)}
        </div>
        <div>
          <span className="text-slate-400">Regreso:</span>{' '}
          {formatDate(r.endDatetime)}
        </div>
        {r.destination && (
          <div className="sm:col-span-2">
            <span className="text-slate-400">Destino:</span> {r.destination}
          </div>
        )}
      </dl>
      {r.description && (
        <p className="mt-2 text-sm text-slate-500 line-clamp-2">{r.description}</p>
      )}
    </div>
  );
}

async function uploadReservationPhoto(file: File, reservationId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', 'reservation');
  formData.append('entityId', reservationId);
  const { data } = await apiClient.post<{ firebaseUrl: string }>('/storage/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.firebaseUrl;
}

function CheckInOutForm({
  reservation,
  action,
  onSuccess,
  onClose,
}: {
  reservation: Reservation;
  action: 'checkin' | 'checkout';
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fuelPhotoUrl, setFuelPhotoUrl] = useState<string | null>(null);
  const [conditionPhotoUrls, setConditionPhotoUrls] = useState<string[]>([]);
  const [fuelUploading, setFuelUploading] = useState(false);
  const [conditionUploading, setConditionUploading] = useState(false);
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const userId = userData?.id;

  const vehicleLabel = reservation.vehicle
    ? `${reservation.vehicle.plate} – ${reservation.vehicle.brand} ${reservation.vehicle.model}`
    : 'Vehículo';

  const mutation = useMutation({
    mutationFn: async (payload: {
      odometer: number;
      fuelPhotoUrl?: string | null;
      fuelLevel?: string;
      conditionPhotoUrls?: string[];
    }) => {
      const url =
        action === 'checkin'
          ? `/reservations/${reservation.id}/check-in`
          : `/reservations/${reservation.id}/check-out`;
      await apiClient.post(url, {
        odometer: payload.odometer,
        ...(payload.fuelPhotoUrl && { fuelPhotoUrl: payload.fuelPhotoUrl }),
        ...(payload.fuelLevel && payload.fuelLevel.trim() && { fuelLevel: payload.fuelLevel.trim() }),
        ...(payload.conditionPhotoUrls?.length
          ? { conditionPhotoUrls: payload.conditionPhotoUrls }
          : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'my', userId] });
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Error al guardar';
      setError(String(msg));
    },
  });

  const handleFuelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setFuelUploading(true);
    setError(null);
    try {
      const url = await uploadReservationPhoto(file, reservation.id);
      setFuelPhotoUrl(url);
    } catch (err) {
      setError('Error al subir la foto de gasolina');
    } finally {
      setFuelUploading(false);
    }
  };

  const handleConditionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files?.length) return;
    setConditionUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(
        Array.from(files)
          .filter((f) => f.type.startsWith('image/'))
          .map((f) => uploadReservationPhoto(f, reservation.id)),
      );
      setConditionPhotoUrls((prev) => [...prev, ...urls]);
    } catch {
      setError('Error al subir fotos del estado del auto');
    } finally {
      setConditionUploading(false);
    }
  };

  const removeConditionPhoto = (url: string) => {
    setConditionPhotoUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = odometer.trim();
    if (!value) {
      setError('Ingresa el kilometraje en km');
      return;
    }
    const km = parseInt(value, 10);
    if (Number.isNaN(km) || km < 0) {
      setError('El kilometraje debe ser un número mayor o igual a 0');
      return;
    }
    if (action === 'checkout' && reservation.checkinOdometer != null && km < reservation.checkinOdometer) {
      setError('El kilometraje de regreso no puede ser menor que el de salida');
      return;
    }
    mutation.mutate({
      odometer: km,
      fuelPhotoUrl: fuelPhotoUrl || undefined,
      ...(action === 'checkout' && fuelLevel.trim() && { fuelLevel: fuelLevel.trim() }),
      conditionPhotoUrls: conditionPhotoUrls.length ? conditionPhotoUrls : undefined,
    });
  };

  const title = action === 'checkin' ? `Check-in – ${vehicleLabel}` : `Check-out – ${vehicleLabel}`;
  const hint =
    action === 'checkin' && reservation.vehicle?.currentOdometer != null
      ? `Último registro: ${reservation.vehicle.currentOdometer} km`
      : action === 'checkout' && reservation.checkinOdometer != null
        ? `Kilometraje al salir: ${reservation.checkinOdometer} km`
        : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkinout-title"
    >
      <div
        className="flex flex-col w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 shrink-0">
        <h3 id="checkinout-title" className="text-lg font-bold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          aria-label="Cerrar"
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div className="mb-4">
          <label htmlFor="odometer" className="block text-sm font-medium text-slate-700 mb-2">
            Kilometraje (km) *
          </label>
          <input
            id="odometer"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder="Ej. 45200"
            className="w-full px-4 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            autoFocus
          />
          {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
        </div>

        {action === 'checkout' && (
        <div className="mb-4">
          <label htmlFor="fuel-level" className="block text-sm font-medium text-slate-700 mb-2">
            Nivel de gasolina (opcional)
          </label>
          <select
            id="fuel-level"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-700"
          >
            <option value="">Seleccionar…</option>
            <option value="Vacío">Vacío</option>
            <option value="1/4">1/4</option>
            <option value="1/2">1/2</option>
            <option value="3/4">3/4</option>
            <option value="Lleno">Lleno</option>
          </select>
        </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Foto del nivel de gasolina (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFuelChange}
            disabled={fuelUploading}
            className="hidden"
            id="fuel-photo"
          />
          <label
            htmlFor="fuel-photo"
            className="flex items-center justify-center gap-2 min-h-[48px] w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50"
          >
            {fuelUploading ? (
              'Subiendo…'
            ) : fuelPhotoUrl ? (
              <>
                <span className="material-icons text-green-600">check_circle</span>
                Foto de gasolina lista
              </>
            ) : (
              <>
                <span className="material-icons">add_photo_alternate</span>
                Añadir foto de gasolina
              </>
            )}
          </label>
          {fuelPhotoUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={fuelPhotoUrl} alt="Gasolina" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
              <button
                type="button"
                onClick={() => setFuelPhotoUrl(null)}
                className="text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fotos del estado del auto (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleConditionChange}
            disabled={conditionUploading}
            className="hidden"
            id="condition-photos"
          />
          <label
            htmlFor="condition-photos"
            className="flex items-center justify-center gap-2 min-h-[48px] w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50"
          >
            {conditionUploading ? (
              'Subiendo…'
            ) : (
              <>
                <span className="material-icons">photo_library</span>
                Añadir fotos del estado del auto
              </>
            )}
          </label>
          {conditionPhotoUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {conditionPhotoUrls.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="Estado" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => removeConditionPhoto(url)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-4 min-h-[48px] rounded-xl bg-primary-dark text-white font-semibold text-base hover:opacity-90 disabled:opacity-50 transition-opacity mt-auto shrink-0"
        >
          {mutation.isPending ? 'Guardando…' : action === 'checkin' ? 'Confirmar check-in' : 'Confirmar check-out'}
        </button>
      </form>
      </div>
    </div>
  );
}

function ActiveReservationCard({
  r,
  onCheckIn,
  onCheckOut,
}: {
  r: Reservation;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const vehicleLabel = r.vehicle
    ? `${r.vehicle.plate} – ${r.vehicle.brand} ${r.vehicle.model}`
    : 'Vehículo';
  const needsCheckIn = r.checkinOdometer == null;
  const needsCheckOut = r.checkinOdometer != null && r.checkoutOdometer == null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">{r.eventName || 'Reserva'}</h4>
          <p className="text-sm text-slate-600 mt-0.5">{vehicleLabel}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-700'}`}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
        <div>
          <span className="text-slate-400">Salida:</span> {formatDate(r.startDatetime)}
        </div>
        <div>
          <span className="text-slate-400">Regreso:</span> {formatDate(r.endDatetime)}
        </div>
        {r.destination && (
          <div className="sm:col-span-2">
            <span className="text-slate-400">Destino:</span> {r.destination}
          </div>
        )}
      </dl>
      {r.description && (
        <p className="mt-2 text-sm text-slate-500 line-clamp-2">{r.description}</p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {needsCheckIn && (
          <button
            type="button"
            onClick={onCheckIn}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-primary-dark text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-icons">directions_car</span>
            Hacer check-in
          </button>
        )}
        {needsCheckOut && (
          <button
            type="button"
            onClick={onCheckOut}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-icons">flag</span>
            Hacer check-out
          </button>
        )}
      </div>
    </div>
  );
}

export function MyRequestsPage() {
  const { userData } = useAuth();
  const userId = userData?.id;

  const [checkInOut, setCheckInOut] = useState<{ reservation: Reservation; action: 'checkin' | 'checkout' } | null>(null);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', 'my', userId],
    queryFn: async () => {
      const res = await apiClient.get('/reservations', { params: { userId } });
      return res.data;
    },
    enabled: !!userId,
  });

  const pending = reservations.filter((r: Reservation) => r.status === 'pending');
  const active = reservations.filter((r: Reservation) => r.status === 'active');
  const history = reservations.filter(
    (r: Reservation) => r.status !== 'pending' && r.status !== 'active',
  );

  if (!userId) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-amber-800 text-sm">
        No se pudo cargar tu usuario. Cierra sesión y vuelve a entrar.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500">Cargando tus solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {checkInOut && (
        <CheckInOutForm
          reservation={checkInOut.reservation}
          action={checkInOut.action}
          onSuccess={() => setCheckInOut(null)}
          onClose={() => setCheckInOut(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis solicitudes</h1>
          <p className="text-slate-600 mt-1">
            Tus reservas pendientes y el historial de solicitudes de vehículos.
          </p>
        </div>
        <Link
          to="/solicitud-vehiculos"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-dark text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-icons text-lg">add</span>
          Nueva solicitud
        </Link>
      </div>

      {/* Pendientes */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <span className="material-icons text-amber-600">schedule</span>
          Pendientes de aprobación
        </h2>
        {pending.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No tienes solicitudes pendientes.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((r: Reservation) => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>

      {/* En curso */}
      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <span className="material-icons text-green-600">directions_car</span>
            En curso
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((r: Reservation) => (
              <ActiveReservationCard
                key={r.id}
                r={r}
                onCheckIn={() => setCheckInOut({ reservation: r, action: 'checkin' })}
                onCheckOut={() => setCheckInOut({ reservation: r, action: 'checkout' })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Historial */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <span className="material-icons text-slate-600">history</span>
          Historial
        </h2>
        {history.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Aún no tienes reservas en tu historial.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((r: Reservation) => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

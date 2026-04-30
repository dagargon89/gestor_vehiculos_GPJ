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

function statusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'pending':  return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
    case 'active':   return { background: 'rgba(34,197,94,0.15)',  color: '#4ade80' };
    case 'completed':return { background: 'rgba(148,163,184,0.15)',color: 'var(--color-text-muted)' };
    case 'overdue':  return { background: 'rgba(239,68,68,0.15)',  color: '#f87171' };
    case 'cancelled':return { background: 'rgba(148,163,184,0.12)',color: 'var(--color-text-muted)' };
    default:         return { background: 'rgba(148,163,184,0.12)',color: 'var(--color-text-muted)' };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Simple reservation card (pending / history) ────────────────────────────

function ReservationCard({ r }: { r: Reservation }) {
  const vehicleLabel = r.vehicle
    ? `${r.vehicle.plate} – ${r.vehicle.brand} ${r.vehicle.model}`
    : 'Vehículo';

  return (
    <div
      className="rounded-xl p-4 transition-shadow"
      style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,132,255,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.eventName || 'Reserva'}</h4>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-soft)' }}>{vehicleLabel}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle(r.status)}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-soft)' }}>
        <div><span style={{ color: 'var(--color-text-muted)' }}>Salida:</span> {formatDate(r.startDatetime)}</div>
        <div><span style={{ color: 'var(--color-text-muted)' }}>Regreso:</span> {formatDate(r.endDatetime)}</div>
        {r.destination && (
          <div className="sm:col-span-2"><span style={{ color: 'var(--color-text-muted)' }}>Destino:</span> {r.destination}</div>
        )}
      </dl>
      {r.description && (
        <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{r.description}</p>
      )}
    </div>
  );
}

// ─── Overdue warning card ────────────────────────────────────────────────────

function OverdueCard({ r, onCheckOut }: { r: Reservation; onCheckOut: () => void }) {
  const vehicleLabel = r.vehicle
    ? `${r.vehicle.plate} – ${r.vehicle.brand} ${r.vehicle.model}`
    : 'Vehículo';
  const noCheckin        = r.checkinOdometer == null;
  const pendingCheckout  = r.checkinOdometer != null && r.checkoutOdometer == null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.25)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold" style={{ color: '#f87171' }}>{r.eventName || 'Reserva'}</h4>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-soft)' }}>{vehicleLabel}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle('overdue')}>
          Vencida
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-soft)' }}>
        <div><span style={{ color: 'var(--color-text-muted)' }}>Salida:</span> {formatDate(r.startDatetime)}</div>
        <div><span style={{ color: 'var(--color-text-muted)' }}>Regreso:</span> {formatDate(r.endDatetime)}</div>
      </dl>
      <div
        className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
        style={{ background: 'rgba(239,68,68,0.10)', color: '#fca5a5' }}
      >
        <span className="material-icons text-base shrink-0 mt-0.5">warning</span>
        <span>
          {noCheckin
            ? 'No se registró check-in. Comunícate con administración para regularizar.'
            : pendingCheckout
            ? 'Registraste el check-in pero falta el check-out. Completa la devolución para registrar gasolina y kilometraje.'
            : 'Esta reserva venció sin completarse. Revisa con el área de administración.'}
        </span>
      </div>
      {pendingCheckout && (
        <button
          type="button"
          onClick={onCheckOut}
          className="mt-3 w-full min-h-[48px] py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}
        >
          <span className="material-icons">flag</span>
          Hacer check-out pendiente
        </button>
      )}
    </div>
  );
}

// ─── Active reservation card with check-in / check-out ──────────────────────

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
        ...(payload.fuelLevel?.trim() && { fuelLevel: payload.fuelLevel.trim() }),
        ...(payload.conditionPhotoUrls?.length ? { conditionPhotoUrls: payload.conditionPhotoUrls } : {}),
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
    try { setFuelPhotoUrl(await uploadReservationPhoto(file, reservation.id)); }
    catch { setError('Error al subir la foto de gasolina'); }
    finally { setFuelUploading(false); }
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
    } catch { setError('Error al subir fotos del estado del auto'); }
    finally { setConditionUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const km = parseInt(odometer.trim(), 10);
    if (!odometer.trim()) { setError('Ingresa el kilometraje en km'); return; }
    if (Number.isNaN(km) || km < 0) { setError('El kilometraje debe ser un número mayor o igual a 0'); return; }
    if (action === 'checkout' && reservation.checkinOdometer != null && km < reservation.checkinOdometer) {
      setError('El kilometraje de regreso no puede ser menor que el de salida');
      return;
    }
    mutation.mutate({
      odometer: km,
      fuelPhotoUrl: fuelPhotoUrl || undefined,
      ...(action === 'checkout' && fuelLevel.trim() && { fuelLevel }),
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
        className="flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h3 id="checkinout-title" className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Cerrar"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto gap-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="odometer" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-soft)' }}>
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
              className="input-field w-full text-lg py-4"
              autoFocus
            />
            {hint && <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
          </div>

          {action === 'checkout' && (
            <div>
              <label htmlFor="fuel-level" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-soft)' }}>
                Nivel de gasolina (opcional)
              </label>
              <select id="fuel-level" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} className="input-field w-full">
                <option value="">Seleccionar…</option>
                <option value="Vacío">Vacío</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Lleno">Lleno</option>
              </select>
            </div>
          )}

          {/* Fuel photo */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-soft)' }}>
              Foto del nivel de gasolina (opcional)
            </label>
            <input type="file" accept="image/*" capture="environment" onChange={handleFuelChange} disabled={fuelUploading} className="hidden" id="fuel-photo" />
            <label
              htmlFor="fuel-photo"
              className="flex items-center justify-center gap-2 min-h-[48px] w-full py-3 px-4 rounded-xl cursor-pointer transition-colors"
              style={{ border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              {fuelUploading ? 'Subiendo…' : fuelPhotoUrl ? (
                <><span className="material-icons" style={{ color: '#4ade80' }}>check_circle</span> Foto de gasolina lista</>
              ) : (
                <><span className="material-icons">add_photo_alternate</span> Añadir foto de gasolina</>
              )}
            </label>
            {fuelPhotoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img src={fuelPhotoUrl} alt="Gasolina" className="h-16 w-16 object-cover rounded-lg" style={{ border: '1px solid var(--color-border)' }} />
                <button type="button" onClick={() => setFuelPhotoUrl(null)} className="text-sm" style={{ color: '#f87171' }}>Quitar</button>
              </div>
            )}
          </div>

          {/* Condition photos */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-soft)' }}>
              Fotos del estado del auto (opcional)
            </label>
            <input type="file" accept="image/*" capture="environment" multiple onChange={handleConditionChange} disabled={conditionUploading} className="hidden" id="condition-photos" />
            <label
              htmlFor="condition-photos"
              className="flex items-center justify-center gap-2 min-h-[48px] w-full py-3 px-4 rounded-xl cursor-pointer transition-colors"
              style={{ border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              {conditionUploading ? 'Subiendo…' : <><span className="material-icons">photo_library</span> Añadir fotos del estado del auto</>}
            </label>
            {conditionPhotoUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {conditionPhotoUrls.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="Estado" className="h-16 w-16 object-cover rounded-lg" style={{ border: '1px solid var(--color-border)' }} />
                    <button
                      type="button"
                      onClick={() => setConditionPhotoUrls((prev) => prev.filter((u) => u !== url))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ background: '#ef4444', color: '#fff' }}
                      aria-label="Quitar foto"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full py-4 min-h-[48px] text-base font-semibold disabled:opacity-50 mt-auto shrink-0"
          >
            {mutation.isPending ? 'Guardando…' : action === 'checkin' ? 'Confirmar check-in' : 'Confirmar check-out'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Active card with check-in / check-out buttons ──────────────────────────

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
  const needsCheckIn  = r.checkinOdometer == null;
  const needsCheckOut = r.checkinOdometer != null && r.checkoutOdometer == null;

  return (
    <div
      className="rounded-xl p-4 transition-shadow"
      style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,132,255,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.eventName || 'Reserva'}</h4>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-soft)' }}>{vehicleLabel}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle(r.status)}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-soft)' }}>
        <div><span style={{ color: 'var(--color-text-muted)' }}>Salida:</span> {formatDate(r.startDatetime)}</div>
        <div><span style={{ color: 'var(--color-text-muted)' }}>Regreso:</span> {formatDate(r.endDatetime)}</div>
        {r.destination && (
          <div className="sm:col-span-2"><span style={{ color: 'var(--color-text-muted)' }}>Destino:</span> {r.destination}</div>
        )}
      </dl>
      {r.description && (
        <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{r.description}</p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {needsCheckIn && (
          <button
            type="button"
            onClick={onCheckIn}
            className="btn-primary w-full min-h-[48px] py-3 px-4 flex items-center justify-center gap-2"
          >
            <span className="material-icons">directions_car</span>
            Hacer check-in
          </button>
        )}
        {needsCheckOut && (
          <button
            type="button"
            onClick={onCheckOut}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            <span className="material-icons">flag</span>
            Hacer check-out
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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

  const pending  = reservations.filter((r: Reservation) => r.status === 'pending');
  const active   = reservations.filter((r: Reservation) => r.status === 'active');
  const overdue  = reservations.filter((r: Reservation) => r.status === 'overdue');
  const history  = reservations.filter((r: Reservation) => !['pending', 'active', 'overdue'].includes(r.status));

  if (!userId) {
    return (
      <div className="rounded-xl p-6 text-sm" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
        No se pudo cargar tu usuario. Cierra sesión y vuelve a entrar.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p style={{ color: 'var(--color-text-muted)' }}>Cargando tus solicitudes...</p>
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Mis solicitudes</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Tus reservas pendientes y el historial de solicitudes de vehículos.
          </p>
        </div>
        <Link
          to="/solicitud-vehiculos"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5"
        >
          <span className="material-icons text-lg">add</span>
          Nueva solicitud
        </Link>
      </div>

      {/* Vencidas — aviso prominente */}
      {overdue.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: '#f87171' }}>
            <span className="material-icons">warning</span>
            Reservas vencidas ({overdue.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overdue.map((r: Reservation) => (
              <OverdueCard
                key={r.id}
                r={r}
                onCheckOut={() => setCheckInOut({ reservation: r, action: 'checkout' })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pendientes */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: '#fbbf24' }}>
          <span className="material-icons">schedule</span>
          Pendientes de aprobación
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            No tienes solicitudes pendientes.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((r: Reservation) => <ReservationCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {/* En curso */}
      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: '#4ade80' }}>
            <span className="material-icons">directions_car</span>
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
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-soft)' }}>
          <span className="material-icons">history</span>
          Historial
        </h2>
        {history.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            Aún no tienes reservas en tu historial.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-table-head-bg)' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Vehículo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Evento</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>Salida</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>Regreso</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r: Reservation) => {
                    const vehicleLabel = r.vehicle ? `${r.vehicle.plate} – ${r.vehicle.brand} ${r.vehicle.model}` : '—';
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--color-text-soft)' }}>{vehicleLabel}</td>
                        <td className="px-4 py-3 max-w-[200px]" style={{ color: 'var(--color-text-soft)' }}>
                          <div className="truncate">{r.eventName || '—'}</div>
                          {r.destination && <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{r.destination}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.startDatetime)}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.endDatetime)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={statusBadgeStyle(r.status)}>
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

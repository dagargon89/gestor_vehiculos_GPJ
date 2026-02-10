import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

type Vehicle = { id: string; plate: string; brand: string; model: string };

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

export function MyRequestsPage() {
  const { userData } = useAuth();
  const userId = userData?.id;

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', 'my', userId],
    queryFn: async () => {
      const res = await apiClient.get('/reservations', { params: { userId } });
      return res.data;
    },
    enabled: !!userId,
  });

  const pending = reservations.filter((r: Reservation) => r.status === 'pending');
  const history = reservations.filter((r: Reservation) => r.status !== 'pending');

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

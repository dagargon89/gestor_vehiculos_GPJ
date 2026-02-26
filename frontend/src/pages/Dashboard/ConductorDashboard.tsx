import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { AllReservationsCalendar } from '../../components/calendar/AllReservationsCalendar';

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color?: string;
  status: string;
};

const VEHICLE_STATUS_CONFIG: { key: string; label: string }[] = [
  { key: 'available', label: 'Disponibles' },
  { key: 'in_use', label: 'En Uso' },
  { key: 'maintenance', label: 'En Mantenimiento' },
  { key: 'inactive', label: 'Inactivos' },
];

export function ConductorDashboard() {
  const { userData } = useAuth();
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [alertDismissed, setAlertDismissed] = useState(false);

  const userName = userData?.displayName?.split(' ').slice(0, 2).join(' ') || userData?.email?.split('@')[0] || 'Conductor';

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

  const { data: pendingReservations = [] } = useQuery({
    queryKey: ['reservations', 'pending', userData?.id],
    queryFn: async () => {
      const res = await apiClient.get('/reservations', {
        params: { userId: userData?.id, status: 'pending' },
      });
      return res.data;
    },
    enabled: !!userData?.id,
  });

  const availableCount = vehicles.filter((v: Vehicle) => v.status === 'available').length;
  const pendingCount = pendingReservations.length;

  const vehiclesByStatus = (status: string) =>
    (vehicles as Vehicle[]).filter((v) => v.status === status);

  const vehicleLabel = (v: Vehicle) =>
    [v.brand, v.model, v.color].filter(Boolean).join(' ') + ` (${v.plate})`;

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Bienvenido al Dashboard, {userName}
      </h2>

      {!alertDismissed && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 border-l-4 border-l-primary bg-white p-4 shadow-sm">
          <span className="material-icons text-primary shrink-0">info</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700">
              Recuerda subir las evidencias fotográficas de medidores y observaciones al salir y al regresar de cada viaje. Revisa tu perfil para más detalles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAlertDismissed(true)}
            className="shrink-0 p-1 rounded text-slate-400 hover:text-slate-600"
            aria-label="Cerrar aviso"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-primary">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons text-primary text-2xl">directions_car</span>
              <h3 className="text-lg font-bold text-slate-900">Vehículos Disponibles</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{availableCount}</p>
            <Link
              to="/solicitud-vehiculos"
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-primary-dark transition-colors"
            >
              <span className="material-icons text-lg">add</span>
              Solicitar Uno
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons text-slate-600 text-2xl">event_note</span>
              <h3 className="text-lg font-bold text-slate-900">Mis Solicitudes Pendientes</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
            <Link
              to="/mis-solicitudes"
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary border border-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <span className="material-icons text-lg">list</span>
              Ver Mis Solicitudes
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {VEHICLE_STATUS_CONFIG.map(({ key, label }) => {
          const list = vehiclesByStatus(key);
          const isAvailable = key === 'available';
          return (
            <div
              key={key}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 overflow-hidden ${
                isAvailable ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <h4 className="text-sm font-semibold text-slate-700 mb-2">{label}</h4>
              <p className="text-2xl font-bold text-slate-900 mb-3">{list.length}</p>
              {list.length === 0 ? (
                <p className="text-sm text-slate-500">No hay vehículos en este estatus.</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {list.map((v) => (
                    <li key={v.id} className="flex items-start gap-1.5">
                      <span className="material-icons text-slate-400 text-base shrink-0 mt-0.5">directions_car</span>
                      <span className="break-words">{vehicleLabel(v)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Calendario de Disponibilidad de Vehículos
        </h3>
        <AllReservationsCalendar
          currentDate={calendarDate}
          onNavigate={setCalendarDate}
          minHeight={420}
        />
        <p className="mt-3 text-sm text-slate-500">
          Aquí podrás ver qué vehículos están disponibles y cuándo.
        </p>
      </div>
    </>
  );
}

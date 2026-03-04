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

const VEHICLE_STATUS_CONFIG: {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  ring: string;
  dot: string;
}[] = [
  {
    key: 'available',
    label: 'Disponibles',
    icon: 'check_circle',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  {
    key: 'in_use',
    label: 'En Uso',
    icon: 'directions_car',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    ring: 'ring-blue-200',
    dot: 'bg-blue-500',
  },
  {
    key: 'maintenance',
    label: 'Mantenimiento',
    icon: 'build',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
  },
  {
    key: 'inactive',
    label: 'Inactivos',
    icon: 'do_not_disturb_on',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    ring: 'ring-slate-200',
    dot: 'bg-slate-400',
  },
];

export function ConductorDashboard() {
  const { userData } = useAuth();
  const [calendarDate, setCalendarDate] = useState(() => new Date());

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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Vehículos disponibles */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-inset ring-emerald-200 flex flex-col gap-4 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <span className="material-icons text-xl text-emerald-600">directions_car</span>
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600">{availableCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-700">Vehículos Disponibles</span>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <Link
              to="/solicitud-vehiculos"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-emerald-600 transition-colors"
            >
              <span className="material-icons text-base">add</span>
              Solicitar vehículo
            </Link>
          </div>
        </div>

        {/* Mis solicitudes pendientes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-inset ring-amber-200 flex flex-col gap-4 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <span className="material-icons text-xl text-amber-600">event_note</span>
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-amber-600">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 bg-amber-500" />
            <span className="text-sm font-semibold text-slate-700">Mis Solicitudes Pendientes</span>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <Link
              to="/mis-solicitudes"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-300 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <span className="material-icons text-base">list</span>
              Ver mis solicitudes
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {VEHICLE_STATUS_CONFIG.map(({ key, label, icon, color, bg, ring, dot }) => {
          const list = vehiclesByStatus(key);
          return (
            <div
              key={key}
              className={`bg-white rounded-2xl p-5 shadow-sm ring-1 ring-inset flex flex-col gap-4 transition-shadow hover:shadow-md ${ring}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <span className={`material-icons text-xl ${color}`}>{icon}</span>
                </div>
                <span className={`text-3xl font-extrabold tracking-tight ${color}`}>{list.length}</span>
              </div>

              {/* Label + dot */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>

              {/* Vehicle list */}
              <div className="border-t border-slate-100 pt-3 flex-1">
                {list.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sin vehículos</p>
                ) : (
                  <ul className="space-y-1.5">
                    {list.map((v) => (
                      <li key={v.id} className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                        <span className="text-xs text-slate-600 truncate">{vehicleLabel(v)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          Calendario de Disponibilidad de Vehículos
        </h3>
        <AllReservationsCalendar
          currentDate={calendarDate}
          onNavigate={setCalendarDate}
          minHeight={420}
        />
      </div>
    </>
  );
}

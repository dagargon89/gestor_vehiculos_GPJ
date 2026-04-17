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
  variant: 'green' | 'blue' | 'amber' | 'slate';
}[] = [
  { key: 'available',   label: 'Disponibles',   icon: 'check_circle',       variant: 'green' },
  { key: 'in_use',      label: 'En Uso',         icon: 'directions_car',     variant: 'blue'  },
  { key: 'maintenance', label: 'Mantenimiento',  icon: 'build',              variant: 'amber' },
  { key: 'inactive',    label: 'Inactivos',      icon: 'do_not_disturb_on',  variant: 'slate' },
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
      <h2
        className="text-xl sm:text-2xl font-bold mb-6 leading-snug"
        style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}
      >
        Bienvenido, {userName}
      </h2>

      {/* Cards de acción rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Vehículos disponibles */}
        <div className="stat-card green">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>directions_car</span>
            </div>
            <span className="stat-card__value">{availableCount}</span>
          </div>
          <div className="stat-card__label">Vehículos disponibles</div>
          <div className="stat-card__sub" style={{ marginTop: 12 }}>
            <Link
              to="/solicitud-vehiculos"
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
            >
              <span className="material-icons text-sm">add</span>
              Solicitar vehículo
            </Link>
          </div>
        </div>

        {/* Solicitudes pendientes */}
        <div className="stat-card amber">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>event_note</span>
            </div>
            <span className="stat-card__value">{pendingCount}</span>
          </div>
          <div className="stat-card__label">Mis solicitudes pendientes</div>
          <div className="stat-card__sub" style={{ marginTop: 12 }}>
            <Link
              to="/mis-solicitudes"
              className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
            >
              <span className="material-icons text-sm">list</span>
              Ver mis solicitudes
            </Link>
          </div>
        </div>
      </div>

      {/* Estado de flota por categoría */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {VEHICLE_STATUS_CONFIG.map(({ key, label, icon, variant }) => {
          const list = vehiclesByStatus(key);
          return (
            <div key={key} className={`stat-card ${variant}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="stat-card__icon">
                  <span className="material-icons" style={{ fontSize: 20 }}>{icon}</span>
                </div>
                <span className="stat-card__value">{list.length}</span>
              </div>
              <div className="stat-card__label">{label}</div>
              <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 10, flex: 1 }}>
                {list.length === 0 ? (
                  <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Sin vehículos</p>
                ) : (
                  <ul className="space-y-1.5">
                    {list.map((v) => (
                      <li key={v.id} className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'currentColor', opacity: 0.6 }} />
                        <span className="text-xs truncate font-mono-data" style={{ color: 'var(--color-text-soft)' }}>{vehicleLabel(v)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendario */}
      <div className="mb-8">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-text)' }}>
          Calendario de disponibilidad de vehículos
        </h3>
        <AllReservationsCalendar
          currentDate={calendarDate}
          onNavigate={setCalendarDate}
          minHeight={620}
        />
      </div>
    </>
  );
}

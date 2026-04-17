import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { AllReservationsCalendar } from '../../components/calendar/AllReservationsCalendar';

export function Dashboard() {
  const [dateRange] = useState('last30');
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await apiClient.get('/reservations');
      return res.data;
    },
  });

  const activeCount = vehicles.filter((v: { status: string }) => v.status === 'available' || v.status === 'in_use').length;
  const totalFleet = vehicles.length;
  const reservationsThisMonth = reservations.filter((r: { startDatetime: string }) => {
    const d = new Date(r.startDatetime);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const utilization = totalFleet > 0 ? Math.round((activeCount / totalFleet) * 100) : 0;

  return (
    <>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
            Resumen del panel
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>Métricas de la flota en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm"
          >
            <span className="material-icons text-base">calendar_today</span>
            <span>{dateRange === 'last30' ? 'Últimos 30 días' : dateRange === 'last7' ? 'Últimos 7 días' : 'Este mes'}</span>
            <span className="material-icons text-base">expand_more</span>
          </button>
          <button
            type="button"
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <span className="material-icons text-base">add</span>
            <span>Nuevo reporte</span>
          </button>
        </div>
      </div>

      {/* Stat cards KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total flota */}
        <div className="stat-card blue">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>directions_bus</span>
            </div>
            <span className="stat-card__value">{totalFleet}</span>
          </div>
          <div className="stat-card__label">Total flota</div>
          <div className="stat-card__sub">vehículos registrados</div>
        </div>

        {/* Reservas este mes */}
        <div className="stat-card blue">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>event</span>
            </div>
            <span className="stat-card__value">{reservationsThisMonth}</span>
          </div>
          <div className="stat-card__label">Reservas este mes</div>
          <div className="stat-card__sub">
            <span className="badge badge-blue">Activas</span>
          </div>
        </div>

        {/* Disponibilidad */}
        <div className="stat-card green">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>check_circle</span>
            </div>
            <span className="stat-card__value">{utilization}%</span>
          </div>
          <div className="stat-card__label">Disponibilidad</div>
          <div className="stat-card__sub">{activeCount} en operación</div>
        </div>

        {/* Alertas mantenimiento */}
        <div className="stat-card amber">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>warning</span>
            </div>
            <span className="stat-card__value">—</span>
          </div>
          <div className="stat-card__label">Alertas mantenimiento</div>
          <div className="stat-card__sub">
            <span className="badge badge-amber">Próximamente</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Tendencias de uso</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Reservas y utilización por período</p>
            </div>
            <div className="flex gap-1">
              <button type="button" className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="material-icons text-base">download</span>
              </button>
              <button type="button" className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="material-icons text-base">more_horiz</span>
              </button>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-center justify-center rounded-xl"
            style={{ border: '2px dashed var(--color-border)', background: 'rgba(99,102,241,0.02)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Gráfico de tendencias (integrar con datos reales)</p>
          </div>
        </div>

        {/* Donut estado de flota */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-base font-bold mb-6" style={{ color: 'var(--color-text)' }}>Estado de la flota</h3>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="var(--color-border)" strokeWidth="12" />
              <circle
                cx="50" cy="50" fill="transparent" r="40"
                stroke="#6366f1"
                strokeDasharray={totalFleet > 0 ? `${(utilization / 100) * 251.2} 251.2` : '0 251.2'}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono-data font-bold" style={{ fontSize: 28, color: 'var(--color-text)' }}>
                {totalFleet > 0 ? utilization : 0}%
              </span>
              <span className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Operativos</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-soft)' }}>Disponibles</span>
              </div>
              <span className="text-sm font-semibold font-mono-data" style={{ color: 'var(--color-text)' }}>{activeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-border-strong)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-soft)' }}>Total</span>
              </div>
              <span className="text-sm font-semibold font-mono-data" style={{ color: 'var(--color-text)' }}>{totalFleet}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Calendario de reservas</h3>
          <Link to="/reservations" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--color-link)' }}>
            Ver todas las reservas
          </Link>
        </div>
        <AllReservationsCalendar
          currentDate={calendarDate}
          onNavigate={setCalendarDate}
          minHeight={620}
        />
      </div>

      {/* Actividad reciente */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Actividad reciente</h3>
          <Link to="/reservations" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--color-link)' }}>
            Ver todas las reservas
          </Link>
        </div>
        <div className="space-y-5">
          {reservations.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>No hay actividad reciente.</p>
          ) : (
            reservations.slice(0, 4).map((r: { id: string; vehicle?: { plate: string }; startDatetime: string; endDatetime: string; status: string; user?: { displayName?: string } }) => (
              <div key={r.id} className="flex gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                  <span className="material-icons" style={{ fontSize: 18 }}>directions_car</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        Reserva{' '}
                        <span className="font-mono-data font-semibold" style={{ color: '#818cf8' }}>{r.vehicle?.plate ?? '—'}</span>
                        {' · '}
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                          {new Date(r.startDatetime).toLocaleDateString()} – {new Date(r.endDatetime).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Estado: {r.status}</p>
                    </div>
                    <span className="text-xs whitespace-nowrap font-mono-data" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(r.startDatetime).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../services/api.service';
import { AllReservationsCalendar } from '../../components/calendar/AllReservationsCalendar';

type DateRangeKey = 'last7' | 'last30' | 'thisMonth';

type Reservation = {
  id: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  vehicle?: { plate: string };
  user?: { displayName?: string };
};

type MaintenanceRecord = {
  id: string;
  scheduledDate: string;
  status: string;
  vehicle?: { plate: string };
};

type Incident = {
  id: string;
  status: string;
  date: string;
};

type Cost = {
  id: string;
  amount: number;
  date: string;
  category: string;
};

function getRangeLabel(key: DateRangeKey) {
  if (key === 'last7') return 'Últimos 7 días';
  if (key === 'last30') return 'Últimos 30 días';
  return 'Este mes';
}

function getRangeDates(key: DateRangeKey): { start: Date; end: Date } {
  const now = new Date();
  if (key === 'last7') return { start: new Date(now.getTime() - 7 * 86400000), end: now };
  if (key === 'last30') return { start: new Date(now.getTime() - 30 * 86400000), end: now };
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
}

function buildTrendData(reservations: Reservation[], key: DateRangeKey) {
  const { start, end } = getRangeDates(key);
  const days: { date: Date; label: string }[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(23, 59, 59, 999);
  while (cur <= endDay) {
    const d = new Date(cur);
    const label =
      key === 'last7'
        ? d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
        : `${d.getDate()}/${d.getMonth() + 1}`;
    days.push({ date: d, label });
    cur.setDate(cur.getDate() + 1);
  }
  return days.map(({ date, label }) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const reservas = reservations.filter((r) => {
      const d = new Date(r.startDatetime);
      return d >= date && d < next;
    }).length;
    return { label, reservas };
  });
}

export function Dashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRangeKey>('last30');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target as Node)) {
        setRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await apiClient.get('/vehicles')).data,
  });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations'],
    queryFn: async () => (await apiClient.get('/reservations')).data,
  });

  const { data: maintenanceRecords = [] } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance'],
    queryFn: async () => (await apiClient.get('/maintenance')).data,
  });

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => (await apiClient.get('/incidents')).data,
  });

  const { data: costs = [] } = useQuery<Cost[]>({
    queryKey: ['costs'],
    queryFn: async () => (await apiClient.get('/costs')).data,
    retry: false,
  });

  const { start, end } = getRangeDates(dateRange);

  const activeCount = vehicles.filter(
    (v: { status: string }) => v.status === 'available' || v.status === 'in_use',
  ).length;
  const totalFleet = vehicles.length;
  const utilization = totalFleet > 0 ? Math.round((activeCount / totalFleet) * 100) : 0;

  const reservationsInRange = reservations.filter((r) => {
    const d = new Date(r.startDatetime);
    return d >= start && d <= end;
  });

  const now = new Date();
  const in30days = new Date(now.getTime() + 30 * 86400000);
  const maintenanceAlerts = maintenanceRecords.filter((m) => {
    if (m.status !== 'scheduled') return false;
    const d = new Date(m.scheduledDate);
    return d >= now && d <= in30days;
  });

  const openIncidents = incidents.filter((i) => i.status === 'open');

  const costsInRange = costs.filter((c) => {
    const d = new Date(c.date);
    return d >= start && d <= end;
  });
  const totalCostsInRange = costsInRange.reduce((acc, c) => acc + Number(c.amount), 0);

  const trendData = buildTrendData(reservations, dateRange);

  const fmtCurrency = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

  return (
    <>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold"
            style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}
          >
            Resumen del panel
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Métricas de la flota en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de rango de fechas */}
          <div className="relative" ref={rangeRef}>
            <button
              type="button"
              onClick={() => setRangeOpen((o) => !o)}
              className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm"
            >
              <span className="material-icons text-base">calendar_today</span>
              <span>{getRangeLabel(dateRange)}</span>
              <span className="material-icons text-base">
                {rangeOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {rangeOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-[12px] shadow-xl border py-1 min-w-[180px]"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {(['last7', 'last30', 'thisMonth'] as DateRangeKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setDateRange(k);
                      setRangeOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color:
                        dateRange === k ? 'var(--color-primary)' : 'var(--color-text)',
                      fontWeight: dateRange === k ? 700 : 400,
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    {getRangeLabel(k)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <span className="material-icons text-base">bar_chart</span>
            <span>Ver reportes</span>
          </button>
        </div>
      </div>

      {/* Stat cards KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total flota */}
        <div className="stat-card blue">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>
                directions_bus
              </span>
            </div>
            <span className="stat-card__value">{totalFleet}</span>
          </div>
          <div className="stat-card__label">Total flota</div>
          <div className="stat-card__sub">vehículos registrados</div>
        </div>

        {/* Reservas en rango */}
        <div className="stat-card blue">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>
                event
              </span>
            </div>
            <span className="stat-card__value">{reservationsInRange.length}</span>
          </div>
          <div className="stat-card__label">Reservas</div>
          <div className="stat-card__sub">
            <span className="badge badge-blue">{getRangeLabel(dateRange)}</span>
          </div>
        </div>

        {/* Disponibilidad */}
        <div className="stat-card green">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>
                check_circle
              </span>
            </div>
            <span className="stat-card__value">{utilization}%</span>
          </div>
          <div className="stat-card__label">Disponibilidad</div>
          <div className="stat-card__sub">{activeCount} en operación</div>
        </div>

        {/* Alertas mantenimiento */}
        <Link to="/maintenance" className="stat-card amber" style={{ textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon">
              <span className="material-icons" style={{ fontSize: 20 }}>
                build
              </span>
            </div>
            <span className="stat-card__value">{maintenanceAlerts.length}</span>
          </div>
          <div className="stat-card__label">Mantenimientos próximos</div>
          <div className="stat-card__sub">
            {maintenanceAlerts.length === 0 ? (
              <span className="badge badge-green">Al día</span>
            ) : (
              <span className="badge badge-amber">Próximos 30 días</span>
            )}
          </div>
        </Link>
      </div>

      {/* Segunda fila de KPIs: incidentes abiertos + costos del período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/incidents" className="stat-card" style={{ textDecoration: 'none', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <span className="material-icons" style={{ fontSize: 20 }}>warning</span>
            </div>
            <span className="stat-card__value" style={{ color: openIncidents.length > 0 ? '#ef4444' : 'var(--color-text)' }}>
              {openIncidents.length}
            </span>
          </div>
          <div className="stat-card__label">Incidentes abiertos</div>
          <div className="stat-card__sub">
            {openIncidents.length === 0 ? (
              <span className="badge badge-green">Sin pendientes</span>
            ) : (
              <span className="badge badge-red">Requieren atención</span>
            )}
          </div>
        </Link>

        <Link to="/costs" className="stat-card" style={{ textDecoration: 'none', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon" style={{ background: 'rgba(99,132,255,0.12)', color: '#6384ff' }}>
              <span className="material-icons" style={{ fontSize: 20 }}>payments</span>
            </div>
            <span className="stat-card__value" style={{ fontSize: totalCostsInRange > 999999 ? 18 : undefined }}>
              {costs.length === 0 ? '—' : fmtCurrency(totalCostsInRange)}
            </span>
          </div>
          <div className="stat-card__label">Costos del período</div>
          <div className="stat-card__sub">
            <span className="badge badge-blue">{getRangeLabel(dateRange)}</span>
          </div>
        </Link>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tendencias de uso - gráfica real */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--color-text)' }}
              >
                Tendencias de uso
              </h3>
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Reservas por período — {getRangeLabel(dateRange)}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Sin datos para el período seleccionado
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6384ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6384ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    interval={dateRange === 'last7' ? 0 : 'preserveStartEnd'}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--color-text)',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    formatter={(value) => [value, 'Reservas']}
                  />
                  <Area
                    type="monotone"
                    dataKey="reservas"
                    stroke="#6384ff"
                    strokeWidth={2}
                    fill="url(#colorReservas)"
                    dot={dateRange === 'last7' ? { r: 4, fill: '#6384ff', strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: '#6384ff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut estado de flota */}
        <div className="glass-panel p-6 flex flex-col">
          <h3
            className="text-base font-bold mb-6"
            style={{ color: 'var(--color-text)' }}
          >
            Estado de la flota
          </h3>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <svg
              className="w-44 h-44 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="var(--color-border)"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#6384ff"
                strokeDasharray={
                  totalFleet > 0
                    ? `${(utilization / 100) * 251.2} 251.2`
                    : '0 251.2'
                }
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="font-mono-data font-bold"
                style={{ fontSize: 28, color: 'var(--color-text)' }}
              >
                {totalFleet > 0 ? utilization : 0}%
              </span>
              <span
                className="text-xs mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Operativos
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#6384ff' }}
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-soft)' }}
                >
                  Disponibles
                </span>
              </div>
              <span
                className="text-sm font-semibold font-mono-data"
                style={{ color: 'var(--color-text)' }}
              >
                {activeCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: 'var(--color-border-strong)' }}
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-soft)' }}
                >
                  Total
                </span>
              </div>
              <span
                className="text-sm font-semibold font-mono-data"
                style={{ color: 'var(--color-text)' }}
              >
                {totalFleet}
              </span>
            </div>
            {maintenanceAlerts.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-soft)' }}>
                    Mantenimiento próximo
                  </span>
                </div>
                <span className="text-sm font-semibold font-mono-data" style={{ color: '#f59e0b' }}>
                  {maintenanceAlerts.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3
            className="text-base font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Calendario de reservas
          </h3>
          <Link
            to="/reservations"
            className="text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-link)' }}
          >
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
          <h3
            className="text-base font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Actividad reciente
          </h3>
          <Link
            to="/reservations"
            className="text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-link)' }}
          >
            Ver todas las reservas
          </Link>
        </div>
        <div className="space-y-5">
          {reservations.length === 0 ? (
            <p
              className="text-sm py-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No hay actividad reciente.
            </p>
          ) : (
            reservations
              .slice()
              .sort(
                (a: Reservation, b: Reservation) =>
                  new Date(b.startDatetime).getTime() -
                  new Date(a.startDatetime).getTime(),
              )
              .slice(0, 4)
              .map(
                (r: Reservation) => (
                  <div key={r.id} className="flex gap-4">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(99,132,255,0.12)',
                        color: '#818cf8',
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: 18 }}>
                        directions_car
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text)' }}
                          >
                            Reserva{' '}
                            <span
                              className="font-mono-data font-semibold"
                              style={{ color: '#818cf8' }}
                            >
                              {r.vehicle?.plate ?? '—'}
                            </span>
                            {' · '}
                            <span
                              style={{
                                color: 'var(--color-text-muted)',
                                fontWeight: 400,
                              }}
                            >
                              {new Date(r.startDatetime).toLocaleDateString()} –{' '}
                              {new Date(r.endDatetime).toLocaleDateString()}
                            </span>
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Estado: {r.status}
                          </p>
                        </div>
                        <span
                          className="text-xs whitespace-nowrap font-mono-data"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {new Date(r.startDatetime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )
          )}
        </div>
      </div>
    </>
  );
}

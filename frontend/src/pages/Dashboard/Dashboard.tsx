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
  checkinOdometer?: number;
  checkoutOdometer?: number;
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

type FuelRecord = {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost?: number;
  odometer?: number;
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

  const { data: fuelRecords = [] } = useQuery<FuelRecord[]>({
    queryKey: ['fuel-records'],
    queryFn: async () => (await apiClient.get('/fuel-records')).data,
    retry: false,
  });

  const { start, end } = getRangeDates(dateRange);

  const activeCount = vehicles.filter(
    (v: { status: string }) => v.status === 'available' || v.status === 'in_use',
  ).length;
  const totalFleet = vehicles.length;
  const utilization = totalFleet > 0 ? Math.round((activeCount / totalFleet) * 100) : 0;

  const fleetByStatus = {
    available: vehicles.filter((v: { status: string }) => v.status === 'available').length,
    in_use: vehicles.filter((v: { status: string }) => v.status === 'in_use').length,
    maintenance: vehicles.filter((v: { status: string }) => v.status === 'maintenance').length,
    inactive: vehicles.filter((v: { status: string }) => v.status === 'inactive').length,
  };
  const fleetLegend = [
    { label: 'Disponibles', n: fleetByStatus.available, c: '#4ade80' },
    { label: 'En uso', n: fleetByStatus.in_use, c: '#60a5fa' },
    { label: 'Mantenimiento', n: fleetByStatus.maintenance, c: '#fbbf24' },
    { label: 'Inactivos', n: fleetByStatus.inactive, c: 'var(--color-border-strong)' },
  ];
  const donutTotal = Math.max(totalFleet, 1);
  let donutOffset = 0;
  const donutSegments = fleetLegend
    .filter((l) => l.n > 0)
    .map((l) => {
      const dash = (l.n / donutTotal) * 251.2;
      const seg = { c: l.c, dash: `${dash} 251.2`, offset: -donutOffset };
      donutOffset += dash;
      return seg;
    });

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
  const fuelRecordsInRange = fuelRecords.filter((f) => {
    const d = new Date(f.date);
    return d >= start && d <= end;
  });
  const fuelCostsInRange = fuelRecordsInRange.reduce((acc, f) => acc + Number(f.cost ?? 0), 0);
  const totalCostsInRange =
    costsInRange.reduce((acc, c) => acc + Number(c.amount), 0) + fuelCostsInRange;

  const kmDrivenInRange = reservationsInRange.reduce((acc, r) => {
    if (r.checkoutOdometer != null && r.checkinOdometer != null) {
      return acc + (r.checkoutOdometer - r.checkinOdometer);
    }
    return acc;
  }, 0);
  const costPerKm = kmDrivenInRange > 0 ? totalCostsInRange / kmDrivenInRange : null;

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
                      (e.currentTarget.style.background = 'rgba(245,165,36,0.08)')
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

      {/* Gauge de disponibilidad */}
      <div className="glass-panel p-6 mb-8 flex flex-col items-center">
        <svg viewBox="0 0 200 116" style={{ width: 200 }}>
          <path d="M 20 106 A 80 80 0 0 1 180 106" fill="none" stroke="var(--color-border)" strokeWidth="13" strokeLinecap="round" />
          <path
            d="M 20 106 A 80 80 0 0 1 180 106"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${(utilization / 100) * 251.2} 251.2`}
            style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div style={{ marginTop: -58, textAlign: 'center' }}>
          <div className="font-mono-data font-bold" style={{ fontSize: 42, color: 'var(--color-text)', lineHeight: 1 }}>{utilization}%</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 2 }}>Disponibilidad</div>
        </div>
        <div className="flex gap-4 mt-5" style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-primary)' }} />{activeCount} operativos</span>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-border-strong)' }} />{totalFleet} en flota</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
            <div className="stat-card__icon" style={{ background: 'rgba(245,165,36,0.12)', color: '#f5a524' }}>
              <span className="material-icons" style={{ fontSize: 20 }}>payments</span>
            </div>
            <span className="stat-card__value" style={{ fontSize: totalCostsInRange > 999999 ? 18 : undefined }}>
              {costsInRange.length === 0 && fuelRecordsInRange.length === 0 ? '—' : fmtCurrency(totalCostsInRange)}
            </span>
          </div>
          <div className="stat-card__label">Costos del período</div>
          <div className="stat-card__sub">
            <span className="badge badge-blue">{getRangeLabel(dateRange)}</span>
          </div>
        </Link>

        <Link to="/reports" className="stat-card" style={{ textDecoration: 'none', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <span className="material-icons" style={{ fontSize: 20 }}>speed</span>
            </div>
            <span className="stat-card__value">
              {costPerKm == null ? '—' : fmtCurrency(costPerKm)}
            </span>
          </div>
          <div className="stat-card__label">Costo por km</div>
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
                      <stop offset="5%" stopColor="#f5a524" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f5a524" stopOpacity={0} />
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
                    stroke="#f5a524"
                    strokeWidth={2}
                    fill="url(#colorReservas)"
                    dot={dateRange === 'last7' ? { r: 4, fill: '#f5a524', strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: '#f5a524' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut estado de flota (4 categorías) */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-base font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Estado de la flota
          </h3>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
              {donutSegments.map((s, i) => (
                <circle
                  key={i}
                  cx="50" cy="50" r="40" fill="transparent"
                  stroke={s.c} strokeWidth="11"
                  strokeDasharray={s.dash} strokeDashoffset={s.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono-data font-bold" style={{ fontSize: 24, color: 'var(--color-text)' }}>{totalFleet}</span>
              <span className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>unidades</span>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {fleetLegend.map((l) => (
              <div key={l.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: 'var(--color-text-soft)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.c }} />
                  {l.label}
                </span>
                <span className="font-semibold font-mono-data" style={{ color: 'var(--color-text)' }}>{l.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos mantenimientos */}
        <div className="lg:col-span-3 glass-panel p-6">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Próximos mantenimientos</h3>
            <Link to="/maintenance" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--color-link)' }}>Ver todos</Link>
          </div>
          {maintenanceAlerts.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sin mantenimientos programados en los próximos 30 días.</p>
          ) : (
            <div className="space-y-3">
              {maintenanceAlerts.slice(0, 3).map((m) => {
                const d = new Date(m.scheduledDate);
                return (
                  <div key={m.id} className="flex gap-3 items-center p-3 rounded-[11px]" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="text-center rounded-[9px]" style={{ minWidth: 44, padding: '6px 8px', background: 'var(--color-bg-soft)' }}>
                      <div className="font-mono-data font-semibold" style={{ fontSize: 16, lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 9.5, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {d.toLocaleDateString('es-MX', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{m.vehicle?.plate ?? '—'}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Mantenimiento programado</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                        background: 'rgba(245,165,36,0.12)',
                        color: '#fbbf24',
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
                              style={{ color: '#fbbf24' }}
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

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../services/api.service';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';

type Tab = 'vehicle-usage' | 'driver-activity' | 'reservations-history' | 'fuel' | 'maintenance';

type VehicleUsageRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  totalReservations: string;
  totalKmDriven: string;
  utilizationRate: string;
};

type DriverActivityRow = {
  id: string;
  driverName: string;
  email: string;
  totalReservations: string;
  totalKmDriven: string;
  totalIncidents: string;
};

type ReservationHistoryRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  userName: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  eventName: string;
  destination: string;
  checkinOdometer: string | null;
  checkoutOdometer: string | null;
  kmDriven: string | null;
};

type FuelRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  totalRecords: string;
  totalLiters: string;
  totalCost: string;
  avgCostPerLiter: string;
};

type MaintenanceRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  totalServices: string;
  completed: string;
  scheduled: string;
  cancelled: string;
  lastServiceDate: string;
  serviceTypes: string;
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'vehicle-usage', label: 'Uso de vehículos', icon: 'directions_car' },
  { id: 'driver-activity', label: 'Conductores', icon: 'people' },
  { id: 'reservations-history', label: 'Historial de reservas', icon: 'history' },
  { id: 'fuel', label: 'Combustible', icon: 'local_gas_station' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'build' },
];

const RES_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  completed: 'Completado',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
};

const RES_STATUS_COLORS: Record<string, string> = {
  pending: 'badge badge-amber',
  active: 'badge badge-blue',
  completed: 'badge badge-green',
  cancelled: 'badge badge-slate',
  rejected: 'badge badge-red',
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDT(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('vehicle-usage');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const params = { startDate, endDate };

  // ---- Queries (each enabled only for its tab) ----
  const vehicleUsageQ = useQuery({
    queryKey: ['reports', 'vehicle-usage', startDate, endDate],
    queryFn: () =>
      apiClient.get('/reports/vehicle-usage', { params }).then((r) => r.data as VehicleUsageRow[]),
    enabled: activeTab === 'vehicle-usage',
  });

  const driverActivityQ = useQuery({
    queryKey: ['reports', 'driver-activity', startDate, endDate],
    queryFn: () =>
      apiClient
        .get('/reports/driver-activity', { params })
        .then((r) => r.data as DriverActivityRow[]),
    enabled: activeTab === 'driver-activity',
  });

  const reservationsHistoryQ = useQuery({
    queryKey: ['reports', 'reservations-history', startDate, endDate],
    queryFn: () =>
      apiClient
        .get('/reports/reservations-history', { params })
        .then((r) => r.data as ReservationHistoryRow[]),
    enabled: activeTab === 'reservations-history',
  });

  const fuelQ = useQuery({
    queryKey: ['reports', 'fuel', startDate, endDate],
    queryFn: () =>
      apiClient.get('/reports/fuel', { params }).then((r) => r.data as FuelRow[]),
    enabled: activeTab === 'fuel',
  });

  const maintenanceQ = useQuery({
    queryKey: ['reports', 'maintenance', startDate, endDate],
    queryFn: () =>
      apiClient.get('/reports/maintenance', { params }).then((r) => r.data as MaintenanceRow[]),
    enabled: activeTab === 'maintenance',
  });

  // ---- Pagination ----
  const vuPag = usePagination<VehicleUsageRow>(vehicleUsageQ.data ?? []);
  const daPag = usePagination<DriverActivityRow>(driverActivityQ.data ?? []);
  const rhPag = usePagination<ReservationHistoryRow>(reservationsHistoryQ.data ?? []);
  const fuPag = usePagination<FuelRow>(fuelQ.data ?? []);
  const maPag = usePagination<MaintenanceRow>(maintenanceQ.data ?? []);

  // ---- Derived chart data (built from already-fetched tab data, no new endpoints) ----
  const topVehiclesByKm = [...(vehicleUsageQ.data ?? [])]
    .sort((a, b) => Number(b.totalKmDriven ?? 0) - Number(a.totalKmDriven ?? 0))
    .slice(0, 5)
    .map((r) => ({ label: r.plate, km: Number(r.totalKmDriven ?? 0) }));

  const monthlyReservations = (() => {
    const counts = new Map<string, number>();
    for (const r of reservationsHistoryQ.data ?? []) {
      if (!r.startDatetime) continue;
      const d = new Date(r.startDatetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, reservas]) => {
        const [y, m] = key.split('-');
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-GT', {
          month: 'short',
          year: '2-digit',
        });
        return { label, reservas };
      });
  })();

  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold"
        style={{
          color: 'var(--color-text)',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
        }}
      >
        Reportes y estadísticas
      </h2>

      {/* Date range */}
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Desde</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-[16px] px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text)' }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Hasta</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-[16px] px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text)' }}
          />
        </label>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px hover:opacity-80"
            style={
              activeTab === t.id
                ? {
                    background: 'var(--color-bg-soft)',
                    border: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-bg-soft)',
                    color: 'var(--color-primary)',
                  }
                : { color: 'var(--color-text-muted)' }
            }
          >
            <span className="material-icons text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >

        {/* ── Uso de vehículos ── */}
        {activeTab === 'vehicle-usage' && (
          <>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Uso de vehículos</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Reservas, kilómetros recorridos y tasa de utilización por vehículo.
              </p>
            </div>
            {vehicleUsageQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
                {topVehiclesByKm.length > 0 && (
                  <div className="px-6 pt-4 pb-2">
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                      Top 5 vehículos por kilometraje
                    </h4>
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topVehiclesByKm}
                          layout="vertical"
                          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                        >
                          <defs>
                            <linearGradient id="topVehKmGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.85} />
                              <stop offset="100%" stopColor="var(--color-primary-dark)" stopOpacity={0.85} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="label"
                            width={90}
                            tick={{ fontSize: 12, fill: 'var(--color-text-soft)' }}
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
                            formatter={(value) => [`${Number(value).toLocaleString()} km`, 'Kilometraje']}
                          />
                          <Bar dataKey="km" fill="url(#topVehKmGradient)" radius={[0, 6, 6, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <TableToolbar
                  page={vuPag.page}
                  totalPages={vuPag.totalPages}
                  totalItems={vuPag.totalItems}
                  pageSize={vuPag.pageSize}
                  onPageChange={vuPag.setPage}
                  onPageSizeChange={vuPag.setPageSize}
                  startIndex={vuPag.startIndex}
                  endIndex={vuPag.endIndex}
                  pageSizeOptions={vuPag.PAGE_SIZE_OPTIONS}
                  onExportCSV={() =>
                    exportToCSV(
                      ['Placa', 'Marca / Modelo', 'Reservas', 'Km recorridos', '% Utilización'],
                      (vehicleUsageQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalReservations,
                        r.totalKmDriven ?? '0',
                        (r.utilizationRate ?? '0') + '%',
                      ]),
                      'uso-vehiculos.csv',
                    )
                  }
                  onExportExcel={() =>
                    exportToExcel(
                      ['Placa', 'Marca / Modelo', 'Reservas', 'Km recorridos', '% Utilización'],
                      (vehicleUsageQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalReservations,
                        r.totalKmDriven ?? '0',
                        (r.utilizationRate ?? '0') + '%',
                      ]),
                      'uso-vehiculos.xlsx',
                      'Uso de vehículos',
                    )
                  }
                  onExportPDF={() =>
                    exportToPDF(
                      ['Placa', 'Marca / Modelo', 'Reservas', 'Km recorridos', '% Utilización'],
                      (vehicleUsageQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalReservations,
                        r.totalKmDriven ?? '0',
                        (r.utilizationRate ?? '0') + '%',
                      ]),
                      'uso-vehiculos.pdf',
                      'Uso de vehículos',
                    )
                  }
                />
                <table className="w-full">
                  <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Placa</th>
                      <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Marca / Modelo</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Reservas</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Km recorridos</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>% Utilización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vuPag.paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                          Sin datos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      vuPag.paginatedData.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-[var(--color-table-row-hover)]"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                          <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}>{row.plate}</td>
                          <td className="px-6 py-4" style={{ color: 'var(--color-text-soft)' }}>
                            {row.brand} {row.model}
                          </td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>
                            {row.totalReservations}
                          </td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>
                            {Number(row.totalKmDriven).toLocaleString()} km
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-primary">
                            {row.utilizationRate ?? '0'}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {/* ── Actividad de conductores ── */}
        {activeTab === 'driver-activity' && (
          <>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Actividad de conductores</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Reservas realizadas, kilómetros recorridos e incidentes registrados por conductor.
              </p>
            </div>
            {driverActivityQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
                <TableToolbar
                  page={daPag.page}
                  totalPages={daPag.totalPages}
                  totalItems={daPag.totalItems}
                  pageSize={daPag.pageSize}
                  onPageChange={daPag.setPage}
                  onPageSizeChange={daPag.setPageSize}
                  startIndex={daPag.startIndex}
                  endIndex={daPag.endIndex}
                  pageSizeOptions={daPag.PAGE_SIZE_OPTIONS}
                  onExportCSV={() =>
                    exportToCSV(
                      ['Conductor', 'Email', 'Reservas', 'Km recorridos', 'Incidentes'],
                      (driverActivityQ.data ?? []).map((r) => [
                        r.driverName,
                        r.email,
                        r.totalReservations,
                        r.totalKmDriven ?? '0',
                        r.totalIncidents,
                      ]),
                      'actividad-conductores.csv',
                    )
                  }
                  onExportExcel={() =>
                    exportToExcel(
                      ['Conductor', 'Email', 'Reservas', 'Km recorridos', 'Incidentes'],
                      (driverActivityQ.data ?? []).map((r) => [
                        r.driverName,
                        r.email,
                        r.totalReservations,
                        r.totalKmDriven ?? '0',
                        r.totalIncidents,
                      ]),
                      'actividad-conductores.xlsx',
                      'Actividad de conductores',
                    )
                  }
                  onExportPDF={() =>
                    exportToPDF(
                      ['Conductor', 'Email', 'Reservas', 'Km recorridos', 'Incidentes'],
                      (driverActivityQ.data ?? []).map((r) => [
                        r.driverName,
                        r.email,
                        r.totalReservations,
                        r.totalKmDriven ?? '0',
                        r.totalIncidents,
                      ]),
                      'actividad-conductores.pdf',
                      'Actividad de conductores',
                    )
                  }
                />
                <table className="w-full">
                  <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Conductor</th>
                      <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Email</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Reservas</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Km recorridos</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Incidentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daPag.paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                          Sin datos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      daPag.paginatedData.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-[var(--color-table-row-hover)]"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                          <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}>{row.driverName}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{row.email}</td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>
                            {row.totalReservations}
                          </td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>
                            {Number(row.totalKmDriven).toLocaleString()} km
                          </td>
                          <td
                            className="px-6 py-4 text-right font-bold"
                            style={{
                              color:
                                Number(row.totalIncidents) > 0 ? '#f87171' : 'var(--color-text-muted)',
                            }}
                          >
                            {row.totalIncidents}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {/* ── Historial de reservas ── */}
        {activeTab === 'reservations-history' && (
          <>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Historial de reservas</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Listado detallado de todas las reservas realizadas en el período.
              </p>
            </div>
            {reservationsHistoryQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
                {monthlyReservations.length > 0 && (
                  <div className="px-6 pt-4 pb-2">
                    <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      Reservas por mes
                    </h4>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      Conteo de reservas por mes en el período seleccionado.
                    </p>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyReservations} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="reservasPorMesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
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
                            formatter={(value) => [String(value), 'Reservas']}
                          />
                          <Area
                            type="monotone"
                            dataKey="reservas"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            fill="url(#reservasPorMesGradient)"
                            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: 'var(--color-primary)' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <TableToolbar
                  page={rhPag.page}
                  totalPages={rhPag.totalPages}
                  totalItems={rhPag.totalItems}
                  pageSize={rhPag.pageSize}
                  onPageChange={rhPag.setPage}
                  onPageSizeChange={rhPag.setPageSize}
                  startIndex={rhPag.startIndex}
                  endIndex={rhPag.endIndex}
                  pageSizeOptions={rhPag.PAGE_SIZE_OPTIONS}
                  onExportCSV={() =>
                    exportToCSV(
                      ['Vehículo', 'Conductor', 'Evento', 'Destino', 'Salida', 'Regreso', 'Estado', 'Km'],
                      (reservationsHistoryQ.data ?? []).map((r) => [
                        `${r.plate} ${r.brand} ${r.model}`,
                        r.userName ?? '—',
                        r.eventName ?? '—',
                        r.destination ?? '—',
                        fmtDT(r.startDatetime),
                        fmtDT(r.endDatetime),
                        RES_STATUS_LABELS[r.status] ?? r.status,
                        r.kmDriven ?? '—',
                      ]),
                      'historial-reservas.csv',
                    )
                  }
                  onExportExcel={() =>
                    exportToExcel(
                      ['Vehículo', 'Conductor', 'Evento', 'Destino', 'Salida', 'Regreso', 'Estado', 'Km'],
                      (reservationsHistoryQ.data ?? []).map((r) => [
                        `${r.plate} ${r.brand} ${r.model}`,
                        r.userName ?? '—',
                        r.eventName ?? '—',
                        r.destination ?? '—',
                        fmtDT(r.startDatetime),
                        fmtDT(r.endDatetime),
                        RES_STATUS_LABELS[r.status] ?? r.status,
                        r.kmDriven ?? '—',
                      ]),
                      'historial-reservas.xlsx',
                      'Historial de reservas',
                    )
                  }
                  onExportPDF={() =>
                    exportToPDF(
                      ['Vehículo', 'Conductor', 'Evento', 'Salida', 'Regreso', 'Estado', 'Km'],
                      (reservationsHistoryQ.data ?? []).map((r) => [
                        `${r.plate} ${r.brand} ${r.model}`,
                        r.userName ?? '—',
                        r.eventName ?? '—',
                        fmtDT(r.startDatetime),
                        fmtDT(r.endDatetime),
                        RES_STATUS_LABELS[r.status] ?? r.status,
                        r.kmDriven ?? '—',
                      ]),
                      'historial-reservas.pdf',
                      'Historial de reservas',
                    )
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Vehículo</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Conductor</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Evento / Destino</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Salida</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Regreso</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Estado</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Km</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rhPag.paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                            Sin datos en el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        rhPag.paginatedData.map((row) => (
                          <tr
                          key={row.id}
                          className="hover:bg-[var(--color-table-row-hover)]"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{row.plate}</span>{' '}
                              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {row.brand} {row.model}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--color-text-soft)' }}>
                              {row.userName ?? '—'}
                            </td>
                            <td className="px-6 py-4 max-w-[180px]">
                              <div className="truncate" style={{ color: 'var(--color-text-soft)' }}>{row.eventName || '—'}</div>
                              {row.destination && (
                                <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.destination}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                              {fmtDT(row.startDatetime)}
                            </td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                              {fmtDT(row.endDatetime)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={RES_STATUS_COLORS[row.status] ?? 'badge badge-slate'}>
                                {RES_STATUS_LABELS[row.status] ?? row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>
                              {row.kmDriven != null ? Number(row.kmDriven).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Combustible ── */}
        {activeTab === 'fuel' && (
          <>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Consumo de combustible</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Registros de combustible, litros cargados, costo total y costo promedio por litro.
              </p>
            </div>
            {fuelQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
                <TableToolbar
                  page={fuPag.page}
                  totalPages={fuPag.totalPages}
                  totalItems={fuPag.totalItems}
                  pageSize={fuPag.pageSize}
                  onPageChange={fuPag.setPage}
                  onPageSizeChange={fuPag.setPageSize}
                  startIndex={fuPag.startIndex}
                  endIndex={fuPag.endIndex}
                  pageSizeOptions={fuPag.PAGE_SIZE_OPTIONS}
                  onExportCSV={() =>
                    exportToCSV(
                      ['Placa', 'Marca / Modelo', 'Registros', 'Litros', 'Costo total', 'Q/litro'],
                      (fuelQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalRecords,
                        r.totalLiters,
                        r.totalCost,
                        r.avgCostPerLiter,
                      ]),
                      'combustible.csv',
                    )
                  }
                  onExportExcel={() =>
                    exportToExcel(
                      ['Placa', 'Marca / Modelo', 'Registros', 'Litros', 'Costo total', 'Q/litro'],
                      (fuelQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalRecords,
                        r.totalLiters,
                        r.totalCost,
                        r.avgCostPerLiter,
                      ]),
                      'combustible.xlsx',
                      'Combustible',
                    )
                  }
                  onExportPDF={() =>
                    exportToPDF(
                      ['Placa', 'Marca / Modelo', 'Registros', 'Litros', 'Costo total', 'Q/litro'],
                      (fuelQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalRecords,
                        r.totalLiters,
                        r.totalCost,
                        r.avgCostPerLiter,
                      ]),
                      'combustible.pdf',
                      'Consumo de combustible',
                    )
                  }
                />
                <table className="w-full">
                  <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Placa</th>
                      <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Marca / Modelo</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Registros</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Litros</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Costo total</th>
                      <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Q / litro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuPag.paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                          Sin datos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      fuPag.paginatedData.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-[var(--color-table-row-hover)]"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                          <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}>{row.plate}</td>
                          <td className="px-6 py-4" style={{ color: 'var(--color-text-soft)' }}>
                            {row.brand} {row.model}
                          </td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>{row.totalRecords}</td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}>
                            {Number(row.totalLiters).toLocaleString()} L
                          </td>
                          <td className="px-6 py-4 text-right font-bold" style={{ color: 'var(--color-text)' }}>
                            Q {Number(row.totalCost).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-muted)' }}>
                            Q {row.avgCostPerLiter}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {/* ── Mantenimiento ── */}
        {activeTab === 'maintenance' && (
          <>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Mantenimiento de vehículos</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Servicios programados, completados y cancelados por vehículo.
              </p>
            </div>
            {maintenanceQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
                <TableToolbar
                  page={maPag.page}
                  totalPages={maPag.totalPages}
                  totalItems={maPag.totalItems}
                  pageSize={maPag.pageSize}
                  onPageChange={maPag.setPage}
                  onPageSizeChange={maPag.setPageSize}
                  startIndex={maPag.startIndex}
                  endIndex={maPag.endIndex}
                  pageSizeOptions={maPag.PAGE_SIZE_OPTIONS}
                  onExportCSV={() =>
                    exportToCSV(
                      ['Placa', 'Marca / Modelo', 'Servicios', 'Completados', 'Programados', 'Cancelados', 'Último servicio', 'Tipos'],
                      (maintenanceQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalServices,
                        r.completed,
                        r.scheduled,
                        r.cancelled,
                        fmtDate(r.lastServiceDate),
                        r.serviceTypes ?? '—',
                      ]),
                      'mantenimiento.csv',
                    )
                  }
                  onExportExcel={() =>
                    exportToExcel(
                      ['Placa', 'Marca / Modelo', 'Servicios', 'Completados', 'Programados', 'Cancelados', 'Último servicio', 'Tipos'],
                      (maintenanceQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalServices,
                        r.completed,
                        r.scheduled,
                        r.cancelled,
                        fmtDate(r.lastServiceDate),
                        r.serviceTypes ?? '—',
                      ]),
                      'mantenimiento.xlsx',
                      'Mantenimiento',
                    )
                  }
                  onExportPDF={() =>
                    exportToPDF(
                      ['Placa', 'Marca / Modelo', 'Servicios', 'Completados', 'Programados', 'Cancelados', 'Último'],
                      (maintenanceQ.data ?? []).map((r) => [
                        r.plate,
                        `${r.brand} ${r.model}`,
                        r.totalServices,
                        r.completed,
                        r.scheduled,
                        r.cancelled,
                        fmtDate(r.lastServiceDate),
                      ]),
                      'mantenimiento.pdf',
                      'Mantenimiento de vehículos',
                    )
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Placa</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Marca / Modelo</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Servicios</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: '#34d399' }}>Completados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: '#fbbf24' }}>Programados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>Cancelados</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Último</th>
                        <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Tipos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maPag.paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                            Sin datos en el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        maPag.paginatedData.map((row) => (
                          <tr
                          key={row.id}
                          className="hover:bg-[var(--color-table-row-hover)]"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}>{row.plate}</td>
                            <td className="px-6 py-4" style={{ color: 'var(--color-text-soft)' }}>
                              {row.brand} {row.model}
                            </td>
                            <td className="px-6 py-4 text-right font-bold" style={{ color: 'var(--color-text)' }}>
                              {row.totalServices}
                            </td>
                            <td className="px-6 py-4 text-right font-medium" style={{ color: '#34d399' }}>
                              {row.completed}
                            </td>
                            <td className="px-6 py-4 text-right" style={{ color: '#fbbf24' }}>{row.scheduled}</td>
                            <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-muted)' }}>{row.cancelled}</td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                              {fmtDate(row.lastServiceDate)}
                            </td>
                            <td className="px-6 py-4 text-sm max-w-[200px]" style={{ color: 'var(--color-text-muted)' }}>
                              <div className="truncate">{row.serviceTypes ?? '—'}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

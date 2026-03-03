import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Reportes</h2>

      {/* Date range */}
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">Desde</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-[16px] border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">Hasta</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-[16px] border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </label>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? 'bg-white border border-b-white border-slate-200 text-primary -mb-px'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-icons text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">

        {/* ── Uso de vehículos ── */}
        {activeTab === 'vehicle-usage' && (
          <>
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Uso de vehículos</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Reservas, kilómetros recorridos y tasa de utilización por vehículo.
              </p>
            </div>
            {vehicleUsageQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
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
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Placa</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Marca / Modelo</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Reservas</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Km recorridos</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">% Utilización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vuPag.paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Sin datos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      vuPag.paginatedData.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.plate}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {row.brand} {row.model}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {row.totalReservations}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
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
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Actividad de conductores</h3>
              <p className="text-sm text-slate-500 mt-0.5">
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
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Conductor</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Reservas</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Km recorridos</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Incidentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daPag.paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Sin datos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      daPag.paginatedData.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.driverName}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{row.email}</td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {row.totalReservations}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {Number(row.totalKmDriven).toLocaleString()} km
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-bold ${
                              Number(row.totalIncidents) > 0 ? 'text-red-600' : 'text-slate-400'
                            }`}
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
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Historial de reservas</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Listado detallado de todas las reservas realizadas en el período.
              </p>
            </div>
            {reservationsHistoryQ.isLoading ? (
              <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
            ) : (
              <>
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
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Vehículo</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Conductor</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Evento / Destino</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Salida</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Regreso</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Km</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rhPag.paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            Sin datos en el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        rhPag.paginatedData.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-slate-900">{row.plate}</span>{' '}
                              <span className="text-slate-500 text-sm">
                                {row.brand} {row.model}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                              {row.userName ?? '—'}
                            </td>
                            <td className="px-6 py-4 max-w-[180px]">
                              <div className="truncate text-slate-700">{row.eventName || '—'}</div>
                              {row.destination && (
                                <div className="truncate text-xs text-slate-400">{row.destination}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                              {fmtDT(row.startDatetime)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                              {fmtDT(row.endDatetime)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  RES_STATUS_COLORS[row.status] ?? 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {RES_STATUS_LABELS[row.status] ?? row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">
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
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Consumo de combustible</h3>
              <p className="text-sm text-slate-500 mt-0.5">
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
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Placa</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Marca / Modelo</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Registros</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Litros</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Costo total</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Q / litro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuPag.paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          Sin datos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      fuPag.paginatedData.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.plate}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {row.brand} {row.model}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">{row.totalRecords}</td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {Number(row.totalLiters).toLocaleString()} L
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            Q {Number(row.totalCost).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500">
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
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Mantenimiento de vehículos</h3>
              <p className="text-sm text-slate-500 mt-0.5">
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
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Placa</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Marca / Modelo</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Servicios</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-green-700">Completados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-amber-600">Programados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-slate-500">Cancelados</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Último</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Tipos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maPag.paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                            Sin datos en el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        maPag.paginatedData.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{row.plate}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {row.brand} {row.model}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                              {row.totalServices}
                            </td>
                            <td className="px-6 py-4 text-right text-green-700 font-medium">
                              {row.completed}
                            </td>
                            <td className="px-6 py-4 text-right text-amber-600">{row.scheduled}</td>
                            <td className="px-6 py-4 text-right text-slate-400">{row.cancelled}</td>
                            <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                              {fmtDate(row.lastServiceDate)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm max-w-[200px]">
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

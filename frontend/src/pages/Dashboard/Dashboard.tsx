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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resumen del panel</h2>
          <p className="text-slate-500 mt-1">Métricas de la flota en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:border-primary transition-colors"
          >
            <span className="material-icons text-base">calendar_today</span>
            <span>
              {dateRange === 'last30' ? 'Últimos 30 días' : dateRange === 'last7' ? 'Últimos 7 días' : 'Este mes'}
            </span>
            <span className="material-icons text-base">expand_more</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-md shadow-primary/30 hover:bg-primary-dark transition-all"
          >
            <span className="material-icons text-base">add</span>
            <span>Nuevo reporte</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons text-6xl text-primary">directions_bus</span>
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total flota</p>
              <h3 className="text-3xl font-bold text-slate-900">{totalFleet}</h3>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-slate-400">vehículos registrados</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons text-6xl text-blue-500">event</span>
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Reservas este mes</p>
              <h3 className="text-3xl font-bold text-slate-900">{reservationsThisMonth}</h3>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                Activas
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons text-6xl text-indigo-500">check_circle</span>
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Disponibilidad</p>
              <h3 className="text-3xl font-bold text-slate-900">{utilization}%</h3>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-slate-400">{activeCount} en operación</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-icons text-6xl text-rose-500">warning</span>
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Alertas mantenimiento</p>
              <h3 className="text-3xl font-bold text-slate-900">—</h3>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-1 rounded-full">
                Próximamente
              </span>
              <Link to="/reports" className="text-xs text-primary hover:underline">Ver reportes</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tendencias de uso</h3>
              <p className="text-sm text-slate-500">Reservas y utilización por período</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors">
                <span className="material-icons">download</span>
              </button>
              <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors">
                <span className="material-icons">more_horiz</span>
              </button>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <p className="text-sm text-slate-400">Gráfico de tendencias (integrar con datos reales)</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Estado de la flota</h3>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f5f9" strokeWidth="12" />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#6366f1"
                strokeDasharray={totalFleet > 0 ? `${(utilization / 100) * 251.2} 251.2` : '0 251.2'}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{totalFleet > 0 ? utilization : 0}%</span>
              <span className="text-xs text-slate-500">Operativos</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-600">Disponibles</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{activeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-sm text-slate-600">Total</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{totalFleet}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Calendario de reservas</h3>
          <Link to="/reservations" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Ver todas las reservas
          </Link>
        </div>
        <AllReservationsCalendar
          currentDate={calendarDate}
          onNavigate={setCalendarDate}
          minHeight={420}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Actividad reciente</h3>
          <Link to="/reservations" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Ver todas las reservas
          </Link>
        </div>
        <div className="space-y-6">
          {reservations.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No hay actividad reciente.</p>
          ) : (
            reservations.slice(0, 4).map((r: { id: string; vehicle?: { plate: string }; startDatetime: string; endDatetime: string; status: string; user?: { displayName?: string } }) => (
              <div key={r.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-icons text-lg">directions_car</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm text-slate-800 font-medium">
                        Reserva <span className="font-semibold text-primary">{r.vehicle?.plate ?? '—'}</span>
                        {' · '}
                        <span className="text-slate-500 font-normal">
                          {new Date(r.startDatetime).toLocaleDateString()} – {new Date(r.endDatetime).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Estado: {r.status}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
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

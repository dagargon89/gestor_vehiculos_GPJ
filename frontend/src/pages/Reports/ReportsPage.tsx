import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';

export function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: report = [], isLoading } = useQuery({
    queryKey: ['reports', 'vehicle-usage', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/reports/vehicle-usage', {
        params: { startDate, endDate },
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Reportes</h2>
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
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-slate-200 font-bold text-slate-900">Uso de vehículos</h3>
        {isLoading ? (
          <div className="px-6 py-8 text-primary font-bold">Cargando...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Placa</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Marca / Modelo</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Reservas</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Km</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">% Uso</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Sin datos en el período.</td>
                </tr>
              ) : (
                report.map((row: { id: string; plate: string; brand: string; model: string; totalReservations: string; totalKmDriven: string; utilizationRate: string }) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.plate}</td>
                    <td className="px-6 py-4 text-slate-600">{row.brand} {row.model}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{row.totalReservations}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{row.totalKmDriven ?? '—'}</td>
                    <td className="px-6 py-4 text-right text-primary font-bold">{row.utilizationRate ?? '—'}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';

export function ReservationsList() {
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await apiClient.get('/reservations');
      return res.data;
    },
  });

  if (isLoading) return <div className="text-primary font-bold">Cargando reservas...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Reservas</h2>
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Vehículo</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Inicio</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fin</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay reservas.</td>
              </tr>
            ) : (
              reservations.map((r: { id: string; vehicle?: { plate: string }; startDatetime: string; endDatetime: string; status: string }) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{r.vehicle?.plate ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(r.startDatetime).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(r.endDatetime).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">{r.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

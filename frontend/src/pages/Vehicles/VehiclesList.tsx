import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';

export function VehiclesList() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data;
    },
  });

  if (isLoading) return <div className="text-primary font-bold">Cargando vehículos...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Vehículos</h2>
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Placa</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Marca</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Modelo</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay vehículos registrados.</td>
              </tr>
            ) : (
              vehicles.map((v: { id: string; plate: string; brand: string; model: string; status: string }) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{v.plate}</td>
                  <td className="px-6 py-4 text-slate-600">{v.brand}</td>
                  <td className="px-6 py-4 text-slate-600">{v.model}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">{v.status}</span>
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

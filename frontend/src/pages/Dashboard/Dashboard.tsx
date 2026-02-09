export function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-500">Vehículos activos</p>
          <p className="text-3xl font-extrabold text-primary mt-1">—</p>
        </div>
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-500">Reservas este mes</p>
          <p className="text-3xl font-extrabold text-accent mt-1">—</p>
        </div>
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-500">Disponibilidad</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">—</p>
        </div>
      </div>
    </div>
  );
}

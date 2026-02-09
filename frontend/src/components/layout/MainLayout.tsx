import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function MainLayout() {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-800">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[16px] bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons">local_shipping</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Plan Juárez</h1>
              <p className="text-xs text-primary font-bold uppercase tracking-wider">Fleet Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">{userData?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-[16px] border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-65px)] bg-white border-r border-slate-200 p-4">
          <nav className="space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-700 font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <span className="material-icons text-xl">dashboard</span>
              Dashboard
            </Link>
            <Link
              to="/vehicles"
              className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-700 font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <span className="material-icons text-xl">directions_car</span>
              Vehículos
            </Link>
            <Link
              to="/reservations"
              className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-700 font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <span className="material-icons text-xl">event</span>
              Reservas
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-700 font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <span className="material-icons text-xl">assessment</span>
              Reportes
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function MainLayout() {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium pb-1 border-b-2 transition-colors ${
      isActive
        ? 'text-primary border-primary'
        : 'text-slate-500 hover:text-primary border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-800">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-icons text-primary text-2xl">local_shipping</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Gestión de Flota</h1>
              <p className="text-xs font-medium text-slate-500">Sistema de Gestión de Flota</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" end className={navClass}>Resumen</NavLink>
            <NavLink to="/vehicles" className={navClass}>Vehículos</NavLink>
            <NavLink to="/reservations" className={navClass}>Reservas</NavLink>
            <NavLink to="/users" className={navClass}>Usuarios</NavLink>
            <NavLink to="/providers" className={navClass}>Proveedores</NavLink>
            <NavLink to="/reports" className={navClass}>Reportes</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-slate-500 hover:text-primary transition-colors rounded-full hover:bg-slate-100"
              aria-label="Notificaciones"
            >
              <span className="material-icons">notifications_none</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {userData?.displayName?.split(' ').slice(0, 2).join(' ') || userData?.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500">{userData?.role?.name || 'Usuario'}</p>
              </div>
              {userData?.photoUrl ? (
                <img
                  src={userData.photoUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-white">
                  <span className="material-icons">person</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-200 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Gestión de Flota. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a className="hover:text-primary transition-colors" href="#">Privacidad</a>
            <a className="hover:text-primary transition-colors" href="#">Términos</a>
            <a className="hover:text-primary transition-colors" href="#">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

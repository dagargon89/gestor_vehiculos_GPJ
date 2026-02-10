import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_ROUTES = [
  { to: '/vehicles', label: 'Gestión de Vehículos' },
  { to: '/reservations', label: 'Gestión de Reservas' },
  { to: '/users', label: 'Gestión de Usuarios' },
  { to: '/providers', label: 'Gestión de Proveedores' },
  { to: '/reports', label: 'Reportes y Estadísticas' },
];

export function MainLayout() {
  const { userData, signOut, authSyncError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = ADMIN_ROUTES.some((r) => location.pathname === r.to || (r.to !== '/' && location.pathname.startsWith(r.to)));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(target)) {
        setAdminMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleGoToProfile = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const handleAdminLink = (to: string) => {
    setAdminMenuOpen(false);
    navigate(to);
  };

  const showSyncBanner = authSyncError && !syncBannerDismissed;
  const userName = userData?.displayName?.split(' ').slice(0, 2).join(' ') || userData?.email?.split('@')[0] || 'Usuario';
  const roleName = (userData?.role?.name || 'Usuario').toLowerCase();

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-800">
      {showSyncBanner && (
        <div className="sticky top-0 z-[60] bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
          <span className="material-icons text-amber-600 shrink-0">warning</span>
          <p className="flex-1 text-sm text-amber-900 font-medium">{authSyncError}</p>
          <button
            type="button"
            onClick={() => setSyncBannerDismissed(true)}
            className="shrink-0 p-1 text-amber-600 hover:text-amber-800 rounded"
            aria-label="Cerrar aviso"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      {/* Barra superior oscura (estilo Flotilla) */}
      <nav className="sticky top-0 z-50 bg-primary-dark shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Título / Logo */}
          <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:opacity-90">
            <span className="material-icons text-2xl">local_shipping</span>
            Gestión de Flota
          </NavLink>

          {/* Enlaces principales + Administración */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/reservations"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              Reservas
            </NavLink>

            {/* Dropdown Administración */}
            <div className="relative" ref={adminMenuRef}>
              <button
                type="button"
                onClick={() => setAdminMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  isAdminRoute ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Administración
                <span className="material-icons text-lg">{adminMenuOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              {adminMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  {ADMIN_ROUTES.map(({ to, label }) => (
                    <button
                      key={to}
                      type="button"
                      onClick={() => handleAdminLink(to)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                        location.pathname === to ? 'text-primary bg-primary/5' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Usuario: "Hola, Nombre (rol)" + dropdown */}
          <div className="relative flex items-center gap-2" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <span className="hidden sm:inline text-sm font-medium">
                Hola, {userName} ({roleName})
              </span>
              {userData?.photoUrl ? (
                <img
                  src={userData.photoUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-icons text-white text-xl">person</span>
                </div>
              )}
              <span className="material-icons text-white/90">{userMenuOpen ? 'expand_less' : 'expand_more'}</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{userData?.displayName || 'Usuario'}</p>
                  <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleGoToProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <span className="material-icons text-lg">person_outline</span>
                    Mi perfil
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-icons text-lg">logout</span>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
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

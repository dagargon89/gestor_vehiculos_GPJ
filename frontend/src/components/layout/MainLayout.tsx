import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function MainLayout() {
  const { userData, signOut, authSyncError } = useAuth();
  const navigate = useNavigate();
  const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleGoToProfile = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium pb-1 border-b-2 transition-colors ${
      isActive
        ? 'text-primary border-primary'
        : 'text-slate-500 hover:text-primary border-transparent'
    }`;

  const showSyncBanner = authSyncError && !syncBannerDismissed;

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

            {/* Dropdown de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
              >
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
                <span className="material-icons text-slate-400 text-lg">
                  {userMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-[16px] shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  {/* Encabezado del dropdown */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {userData?.displayName || 'Usuario'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
                  </div>

                  {/* Opciones */}
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

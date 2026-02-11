import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  ADMIN_ROUTE_ITEMS,
  canAccessDashboard,
  canAccessReservationRequests,
} from '../../config/routePermissions';

export function MainLayout() {
  const { userData, signOut, authSyncError, refreshUserData } = useAuth();
  const [retryingSync, setRetryingSync] = useState(false);
  const { can } = usePermissions();
  const adminRoutes = ADMIN_ROUTE_ITEMS.filter((r) => can(r.resource, r.action));
  const showDashboard = canAccessDashboard(userData?.permissions, userData?.role?.name);
  const showReservationRequests = canAccessReservationRequests(userData?.permissions, userData?.role?.name);
  const navigate = useNavigate();
  const location = useLocation();
  const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
  const [claimAdminLoading, setClaimAdminLoading] = useState(false);
  const [claimAdminError, setClaimAdminError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const canReadNotifications = can('notifications', 'read');
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userData?.id],
    queryFn: async () => {
      const res = await apiClient.get('/notifications', { params: userData?.id ? { userId: userData.id } : {} });
      return res.data;
    },
    enabled: !!userData?.id && canReadNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length;

  const isAdminRoute = adminRoutes.some((r) => location.pathname === r.to || (r.to !== '/' && location.pathname.startsWith(r.to)));

  useEffect(() => {
    if (import.meta.env.DEV && userData != null) {
      console.log('[MainLayout] diagnóstico permisos:', {
        role: userData.role?.name ?? null,
        permissionsCount: userData.permissions?.length ?? 0,
        showDashboard,
        showReservationRequests,
        adminRoutesCount: adminRoutes.length,
      });
    }
  }, [userData, showDashboard, showReservationRequests, adminRoutes.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(target)) {
        setAdminMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleGoToProfile = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const handleGoToMyRequests = () => {
    setUserMenuOpen(false);
    navigate('/mis-solicitudes');
  };

  const handleAdminLink = (to: string) => {
    setAdminMenuOpen(false);
    navigate(to);
  };

  const showSyncBanner = authSyncError && !syncBannerDismissed;
  const showClaimAdminBanner = !authSyncError && !!userData?.id && !userData?.role?.name;
  const userName = userData?.displayName?.split(' ').slice(0, 2).join(' ') || userData?.email?.split('@')[0] || 'Usuario';
  const roleName = (userData?.role?.name || 'Usuario').toLowerCase();

  const handleRetrySync = async () => {
    setRetryingSync(true);
    try {
      await refreshUserData();
    } finally {
      setRetryingSync(false);
    }
  };

  const handleClaimAdmin = async () => {
    setClaimAdminError(null);
    setClaimAdminLoading(true);
    try {
      await apiClient.post('/auth/claim-admin');
      await refreshUserData();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'No se pudo asignar el rol.';
      setClaimAdminError(typeof msg === 'string' ? msg : 'Error al reclamar administrador.');
    } finally {
      setClaimAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-800">
      {showSyncBanner && (
        <div className="sticky top-0 z-[60] bg-amber-50 border-b border-amber-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="material-icons text-amber-600 shrink-0">warning</span>
          <p className="flex-1 text-sm text-amber-900 font-medium min-w-0">{authSyncError}</p>
          <button
            type="button"
            onClick={handleRetrySync}
            disabled={retryingSync}
            className="shrink-0 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 disabled:opacity-50"
          >
            {retryingSync ? 'Conectando…' : 'Reintentar'}
          </button>
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

      {showClaimAdminBanner && (
        <div className="sticky top-0 z-[60] bg-slate-100 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="material-icons text-slate-600 shrink-0">admin_panel_settings</span>
          <p className="flex-1 text-sm text-slate-800">
            No tienes un rol asignado. Si eres el administrador del sistema, puedes reclamar el rol de administrador para acceder al menú.
          </p>
          {claimAdminError && (
            <p className="w-full text-sm text-red-600">{claimAdminError}</p>
          )}
          <button
            type="button"
            onClick={handleClaimAdmin}
            disabled={claimAdminLoading}
            className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {claimAdminLoading ? 'Asignando…' : 'Reclamar rol de administrador'}
          </button>
        </div>
      )}

      {/* Barra superior oscura (estilo Flotilla) */}
      <nav className="sticky top-0 z-50 bg-primary-dark shadow-md">
        <div className="w-full px-4 py-3 flex items-center">
          {/* Logo: pegado a la izquierda */}
          <div className="shrink-0">
            <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:opacity-90">
              <span className="material-icons text-2xl">local_shipping</span>
              Gestión de Flota
            </NavLink>
          </div>

          {/* En móvil: espaciador + hamburguesa a la derecha */}
          <div className="flex flex-1 justify-end md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              <span className="material-icons text-2xl">menu</span>
            </button>
          </div>

          {/* Menú central: Dashboard, Solicitud, Administración (solo desktop) */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center gap-1">
            {showDashboard && (
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
            )}
            {showReservationRequests && (
            <NavLink
              to="/solicitud-vehiculos"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              Solicitud de vehículos
            </NavLink>
            )}

            {/* Dropdown Administración */}
            {adminRoutes.length > 0 && (
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
                  {adminRoutes.map(({ to, label }) => (
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
            )}
            </div>
          </div>

          {/* Derecha: notificaciones + perfil (solo desktop; en móvil van dentro del drawer) */}
          <div className="hidden md:flex shrink-0 items-center gap-2 ml-4">
            {/* Notificaciones (solo si tiene permiso) */}
            {canReadNotifications && (
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label="Notificaciones"
              >
                <span className="material-icons">notifications_none</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="fixed left-2 right-2 top-14 max-h-[70vh] overflow-auto bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 md:absolute md:left-auto md:right-0 md:top-full md:mt-1 md:w-80 md:max-h-[400px]">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <span className="text-sm font-bold text-slate-900">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="text-xs text-slate-500">{unreadCount} sin leer</span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-sm">No hay notificaciones.</div>
                    ) : (
                      notifications.map((n: { id: string; title: string; message: string; read: boolean; createdAt: string; actionUrl?: string }) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            if (!n.read) markAsReadMutation.mutate(n.id);
                            if (n.actionUrl) navigate(n.actionUrl);
                            setNotificationsOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                        >
                          <p className="text-sm font-medium text-slate-900 break-words">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 break-words">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Usuario: "Hola, Nombre (rol)" + dropdown */}
            <div className="relative" ref={userMenuRef}>
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
              <div className="fixed left-2 right-2 top-14 w-auto max-w-xs bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 md:absolute md:left-auto md:right-0 md:top-full md:mt-1 md:w-56">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{userData?.displayName || 'Usuario'}</p>
                  <p className="text-xs text-slate-500 truncate break-all">{userData?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleGoToMyRequests}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <span className="material-icons text-lg">assignment</span>
                    Mis solicitudes
                  </button>
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

      {/* Drawer menú móvil */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl z-50 flex flex-col md:hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="font-bold text-slate-900">Menú</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* En móvil: perfil y notificaciones dentro del drawer */}
            <div className="md:hidden border-b border-slate-200">
              {/* Bloque usuario: foto + nombre + opciones */}
              <div className="p-4 flex items-center gap-3 border-b border-slate-100">
                {userData?.photoUrl ? (
                  <img
                    src={userData.photoUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-icons text-primary text-2xl">person</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{userData?.displayName || 'Usuario'}</p>
                  <p className="text-xs text-slate-500 truncate">Hola, {userName} ({roleName})</p>
                </div>
              </div>
              <div className="py-2">
                {showReservationRequests && (
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigate('/mis-solicitudes'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-icons text-lg">assignment</span>
                  Mis solicitudes
                </button>
                )}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-icons text-lg">person_outline</span>
                  Mi perfil
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="material-icons text-lg">logout</span>
                  Cerrar sesión
                </button>
              </div>
              {/* Notificaciones dentro del drawer (solo si tiene permiso) */}
              {canReadNotifications && (
              <div className="px-4 py-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <span className="material-icons text-lg">notifications_none</span>
                  Notificaciones {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </p>
                <div className="mt-2 max-h-48 overflow-auto divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-slate-500 text-sm">No hay notificaciones.</div>
                  ) : (
                    notifications.slice(0, 10).map((n: { id: string; title: string; message: string; read: boolean; createdAt: string; actionUrl?: string }) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (!n.read) markAsReadMutation.mutate(n.id);
                          if (n.actionUrl) navigate(n.actionUrl);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <p className="text-sm font-medium text-slate-900 break-words">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 break-words">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>

            <nav className="flex-1 overflow-auto py-2">
              {showDashboard && (
              <NavLink
                to="/"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <span className="material-icons text-xl">dashboard</span>
                Dashboard
              </NavLink>
              )}
              {showReservationRequests && (
              <NavLink
                to="/solicitud-vehiculos"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <span className="material-icons text-xl">directions_car</span>
                Solicitud de vehículos
              </NavLink>
              )}
              {adminRoutes.length > 0 && (
              <>
              <div className="px-4 py-2 mt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Administración</p>
              </div>
              {adminRoutes.map(({ to, label }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(to);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                    location.pathname === to ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-icons text-xl text-slate-400">settings</span>
                  {label}
                </button>
              ))}
              </>
              )}
            </nav>
          </div>
        </>
      )}

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

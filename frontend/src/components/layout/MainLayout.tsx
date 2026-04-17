import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../theme/ThemeContext';
import {
  ADMIN_MENU_CATEGORIES,
  ADMIN_ROUTE_ITEMS,
  canAccessDashboard,
  canAccessReservationRequests,
  isConductor,
} from '../../config/routePermissions';

export function MainLayout() {
  const { userData, signOut, authSyncError, refreshUserData } = useAuth();
  const [retryingSync, setRetryingSync] = useState(false);
  const { can } = usePermissions();
  const { theme, toggleTheme } = useTheme();

  const adminRoutes = isConductor(userData?.role?.name)
    ? []
    : ADMIN_ROUTE_ITEMS.filter((r) => can(r.resource, r.action));
  const adminRoutesByCategory = ADMIN_MENU_CATEGORIES.map((cat) => ({
    ...cat,
    items: adminRoutes.filter((r) => r.category === cat.key),
  })).filter((group) => group.items.length > 0);

  const showDashboard = canAccessDashboard(userData?.permissions, userData?.role?.name);
  const showConductorHome = isConductor(userData?.role?.name);
  const showReservationRequests = canAccessReservationRequests(userData?.permissions, userData?.role?.name);

  const navigate = useNavigate();
  const location = useLocation();
  const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const canReadNotifications = can('notifications', 'read') || isConductor(userData?.role?.name);
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
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setUserMenuOpen(false);
      if (adminMenuRef.current && !adminMenuRef.current.contains(target)) setAdminMenuOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };
  const handleGoToProfile = () => { setUserMenuOpen(false); navigate('/profile'); };
  const handleGoToMyRequests = () => { setUserMenuOpen(false); navigate('/mis-solicitudes'); };
  const handleAdminLink = (to: string) => { setAdminMenuOpen(false); navigate(to); };

  const showSyncBanner = authSyncError && !syncBannerDismissed;
  const userName = userData?.displayName?.split(' ').slice(0, 2).join(' ') || userData?.email?.split('@')[0] || 'Usuario';
  const roleName = (userData?.role?.name || 'Usuario').toLowerCase();

  const handleRetrySync = async () => {
    setRetryingSync(true);
    try { await refreshUserData(); } finally { setRetryingSync(false); }
  };

  /* ── estilos reutilizables ── */
  const dropdownStyle: React.CSSProperties = {
    background: 'var(--color-menu-bg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };
  const menuItemBase = 'w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm font-medium transition-colors';

  // En claro el header es blanco/azul hielo → texto oscuro; en oscuro → texto blanco
  const navText    = theme === 'dark' ? '#ffffff'              : 'var(--color-text)';
  const navMuted   = theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)';
  const navHoverBg = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(99,132,255,0.08)';
  const logoIconBg = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(99,132,255,0.10)';
  const logoIconColor = theme === 'dark' ? '#ffffff' : '#6384ff';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Banner de error de sincronización */}
      {showSyncBanner && (
        <div className="sticky top-0 z-[60] px-4 py-3 flex flex-wrap items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)' }}>
          <span className="material-icons shrink-0" style={{ color: '#f59e0b' }}>warning</span>
          <p className="flex-1 text-sm font-medium min-w-0" style={{ color: 'var(--color-text)' }}>{authSyncError}</p>
          <button
            type="button"
            onClick={handleRetrySync}
            disabled={retryingSync}
            className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
          >
            {retryingSync ? 'Conectando…' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={() => setSyncBannerDismissed(true)}
            className="shrink-0 p-1 rounded"
            aria-label="Cerrar aviso"
            style={{ color: '#f59e0b' }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'var(--color-header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 20px rgba(99,102,241,0.15)',
        }}
      >
        <div className="w-full px-4 sm:px-6 py-3 flex items-center min-w-0 gap-2">

          {/* Logo */}
          <div className="shrink-0 min-w-0">
            <NavLink to="/" className="flex items-center gap-2.5 font-bold hover:opacity-90 transition-opacity" style={{ letterSpacing: '-0.3px', color: navText }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: logoIconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(99,132,255,0.25)',
              }}>
                <span className="material-icons" style={{ fontSize: 20, color: logoIconColor }}>local_shipping</span>
              </div>
              <span className="hidden sm:inline text-base leading-tight font-bold">Gestión de Vehículos Institucionales</span>
              <span className="sm:hidden text-sm leading-tight font-bold">Vehículos Inst.</span>
            </NavLink>
          </div>

          {/* Menú central (solo desktop) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center gap-1">
              {showDashboard && (
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
                >
                  Dashboard
                </NavLink>
              )}
              {showConductorHome && (
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
                >
                  Inicio
                </NavLink>
              )}
              {showReservationRequests && (
                <NavLink
                  to="/solicitud-vehiculos"
                  className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
                >
                  Solicitud de vehículos
                </NavLink>
              )}
              {adminRoutes.length > 0 && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAdminMenuOpen((prev) => !prev)}
                    className={`nav-btn${isAdminRoute ? ' active' : ''}`}
                  >
                    Administración
                    <span className="material-icons text-lg">{adminMenuOpen ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {adminMenuOpen && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-xl py-2 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto"
                      style={dropdownStyle}
                    >
                      {adminRoutesByCategory.map(({ key: categoryKey, label: categoryLabel, items }, idx) => (
                        <div key={categoryKey} className={idx > 0 ? 'border-t pt-2 mt-2' : ''} style={{ borderColor: 'var(--color-border)' }}>
                          <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', letterSpacing: '1.2px' }}>{categoryLabel}</p>
                          {items.map(({ to, label, icon }) => (
                            <button
                              key={to}
                              type="button"
                              onClick={() => handleAdminLink(to)}
                              className={`${menuItemBase} rounded-lg mx-1`}
                              style={{
                                color: location.pathname === to ? '#6366f1' : 'var(--color-text-soft)',
                                background: location.pathname === to ? 'rgba(99,102,241,0.08)' : 'transparent',
                              }}
                            >
                              <span className="material-icons text-lg" style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Derecha: toggle tema + notificaciones + perfil (desktop) */}
          <div className="hidden lg:flex shrink-0 items-center gap-1 ml-auto">

            {/* Toggle de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: navMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <span className="material-icons text-xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {/* Notificaciones */}
            {canReadNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: navMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  aria-label="Notificaciones"
                >
                  <span className="material-icons">notifications_none</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white font-mono-data" style={{ fontSize: 10 }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-auto rounded-xl py-2 z-50"
                    style={dropdownStyle}
                  >
                    <div className="px-4 py-2 flex justify-between items-center shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Notificaciones</span>
                      {unreadCount > 0 && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unreadCount} sin leer</span>}
                    </div>
                    <div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay notificaciones.</div>
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
                            className="w-full text-left px-4 py-3 transition-colors"
                            style={{
                              background: !n.read ? 'rgba(99,102,241,0.06)' : 'transparent',
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            <p className="text-sm font-medium break-words" style={{ color: 'var(--color-text)' }}>{n.title}</p>
                            <p className="text-xs mt-0.5 line-clamp-2 break-words" style={{ color: 'var(--color-text-soft)' }}>{n.message}</p>
                            <p className="text-xs mt-1 font-mono-data" style={{ color: 'var(--color-text-muted)' }}>
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

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: navText }}
              onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="hidden xl:inline text-sm font-medium">
                  Hola, {userName} ({roleName})
                </span>
                {userData?.photoUrl ? (
                  <img src={userData.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '2px solid rgba(99,132,255,0.4)' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                    <span className="material-icons text-white" style={{ fontSize: 18 }}>person</span>
                  </div>
                )}
                <span className="material-icons" style={{ color: navMuted }}>{userMenuOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 z-50"
                  style={dropdownStyle}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{userData?.displayName || 'Usuario'}</p>
                    <p className="text-xs truncate break-all" style={{ color: 'var(--color-text-muted)' }}>{userData?.email}</p>
                  </div>
                  <div className="py-1">
                    <button type="button" onClick={handleGoToMyRequests} className={menuItemBase} style={{ color: 'var(--color-text-soft)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="material-icons text-lg" style={{ color: 'var(--color-text-muted)' }}>assignment</span>
                      Mis solicitudes
                    </button>
                    <button type="button" onClick={handleGoToProfile} className={menuItemBase} style={{ color: 'var(--color-text-soft)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="material-icons text-lg" style={{ color: 'var(--color-text-muted)' }}>person_outline</span>
                      Mi perfil
                    </button>
                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                    <button type="button" onClick={handleSignOut} className={menuItemBase} style={{ color: '#f87171' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="material-icons text-lg">logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Móvil/tablet: toggle tema + notificaciones + hamburguesa */}
          <div className="flex flex-1 justify-end items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: navMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              <span className="material-icons text-xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {canReadNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: navMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  aria-label="Notificaciones"
                >
                  <span className="material-icons">notifications_none</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white font-mono-data" style={{ fontSize: 10 }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div
                    className="fixed left-2 right-2 top-14 max-h-[70vh] overflow-auto rounded-xl py-2 z-50"
                    style={dropdownStyle}
                  >
                    <div className="px-4 py-2 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Notificaciones</span>
                      {unreadCount > 0 && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unreadCount} sin leer</span>}
                    </div>
                    <div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay notificaciones.</div>
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
                            className="w-full text-left px-4 py-3 transition-colors"
                            style={{ background: !n.read ? 'rgba(99,102,241,0.06)' : 'transparent', borderBottom: '1px solid var(--color-border)' }}
                          >
                            <p className="text-sm font-medium break-words" style={{ color: 'var(--color-text)' }}>{n.title}</p>
                            <p className="text-xs mt-0.5 line-clamp-2 break-words" style={{ color: 'var(--color-text-soft)' }}>{n.message}</p>
                            <p className="text-xs mt-1 font-mono-data" style={{ color: 'var(--color-text-muted)' }}>
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
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: navText }}
              onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label="Abrir menú"
            >
              <span className="material-icons text-2xl">menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Drawer móvil ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'var(--color-modal-overlay)', backdropFilter: 'blur(4px)' }}
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl z-50 flex flex-col lg:hidden"
            style={{ background: 'var(--color-bg-soft)', borderRight: '1px solid var(--color-border)' }}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>Menú</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="Cerrar menú"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Bloque usuario en drawer */}
            <div style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                {userData?.photoUrl ? (
                  <img src={userData.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: '2px solid var(--color-border-strong)' }} />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                    <span className="material-icons text-white" style={{ fontSize: 22 }}>person</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{userData?.displayName || 'Usuario'}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>Hola, {userName} ({roleName})</p>
                </div>
              </div>
              <div className="py-1">
                {showReservationRequests && (
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); navigate('/mis-solicitudes'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text-soft)' }}
                  >
                    <span className="material-icons text-lg" style={{ color: 'var(--color-text-muted)' }}>assignment</span>
                    Mis solicitudes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-text-soft)' }}
                >
                  <span className="material-icons text-lg" style={{ color: 'var(--color-text-muted)' }}>person_outline</span>
                  Mi perfil
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ color: '#f87171' }}
                >
                  <span className="material-icons text-lg">logout</span>
                  Cerrar sesión
                </button>
              </div>
            </div>

            {/* Navegación en drawer */}
            <nav className="flex-1 overflow-auto py-2">
              {showDashboard && (
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? '' : ''}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? '#6366f1' : 'var(--color-text-soft)',
                    background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  })}
                >
                  <span className="material-icons text-xl" style={{ color: 'var(--color-text-muted)' }}>dashboard</span>
                  Dashboard
                </NavLink>
              )}
              {showConductorHome && (
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
                  style={({ isActive }) => ({
                    color: isActive ? '#6366f1' : 'var(--color-text-soft)',
                    background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  })}
                >
                  <span className="material-icons text-xl" style={{ color: 'var(--color-text-muted)' }}>home</span>
                  Inicio
                </NavLink>
              )}
              {showReservationRequests && (
                <NavLink
                  to="/solicitud-vehiculos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
                  style={({ isActive }) => ({
                    color: isActive ? '#6366f1' : 'var(--color-text-soft)',
                    background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  })}
                >
                  <span className="material-icons text-xl" style={{ color: 'var(--color-text-muted)' }}>directions_car</span>
                  Solicitud de vehículos
                </NavLink>
              )}
              {adminRoutes.length > 0 && (
                <>
                  <div className="px-4 py-2 mt-2">
                    <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '1.2px' }}>Administración</p>
                  </div>
                  {adminRoutesByCategory.map(({ key: categoryKey, label: categoryLabel, items }, idx) => (
                    <div key={categoryKey} className={idx > 0 ? 'mt-2' : ''}>
                      <p className="px-4 py-1.5 text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '1px' }}>{categoryLabel}</p>
                      {items.map(({ to, label, icon }) => (
                        <button
                          key={to}
                          type="button"
                          onClick={() => { setMobileMenuOpen(false); navigate(to); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium transition-colors"
                          style={{
                            color: location.pathname === to ? '#6366f1' : 'var(--color-text-soft)',
                            background: location.pathname === to ? 'rgba(99,102,241,0.08)' : 'transparent',
                          }}
                        >
                          <span className="material-icons text-xl" style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </nav>
          </div>
        </>
      )}

      {/* ── Contenido principal ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-6 sm:mt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex flex-col md:flex-row justify-between items-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          <p>© {new Date().getFullYear()} Gestión de Vehículos Institucionales. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a className="hover:opacity-80 transition-opacity" href="#">Privacidad</a>
            <a className="hover:opacity-80 transition-opacity" href="#">Términos</a>
            <a className="hover:opacity-80 transition-opacity" href="#">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

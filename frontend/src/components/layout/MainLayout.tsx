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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('vehicles-sidebar-collapsed') === 'true');
  useEffect(() => {
    localStorage.setItem('vehicles-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.put(`/notifications/read-all`, null, { params: { userId: userData?.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length;

  const generalItems: { to: string; label: string; icon: string; end?: boolean }[] = [];
  if (showDashboard) generalItems.push({ to: '/', label: 'Dashboard', icon: 'dashboard', end: true });
  if (showConductorHome) generalItems.push({ to: '/', label: 'Inicio', icon: 'home', end: true });
  if (showReservationRequests) generalItems.push({ to: '/solicitud-vehiculos', label: 'Solicitud de vehículos', icon: 'directions_car' });
  generalItems.push({ to: '/mis-solicitudes', label: 'Mis solicitudes', icon: 'assignment' });

  const navGroups: { key: string; label: string; items: { to: string; label: string; icon: string; end?: boolean }[] }[] = [
    ...(generalItems.length > 0 ? [{ key: 'general', label: 'General', items: generalItems }] : []),
    ...adminRoutesByCategory.map((cat) => ({
      key: cat.key,
      label: cat.label,
      items: cat.items.map((it) => ({ to: it.to, label: it.label, icon: it.icon })),
    })),
  ];

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

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: "'Barlow', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Sidebar (desktop, lg+) ── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: sidebarCollapsed ? 72 : 240,
          flexShrink: 0,
          background: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          flexDirection: 'column',
          transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 16px', borderBottom: '1px solid var(--color-sidebar-border)', minHeight: 71 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ fontSize: 21, color: 'var(--color-text-on-primary)' }}>local_shipping</span>
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--color-sidebar-text)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                Flota GPJ
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--color-sidebar-text-muted)', marginTop: 3, whiteSpace: 'nowrap' }}>
                Vehículos institucionales
              </div>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navGroups.map((g) => (
            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!sidebarCollapsed && (
                <div style={{ padding: '14px 8px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--color-sidebar-text-muted)', whiteSpace: 'nowrap' }}>
                  {g.label}
                </div>
              )}
              {g.items.map((it) => {
                const isActive = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to);
                return (
                  <NavLink
                    key={it.to + it.label}
                    to={it.to}
                    end={it.end}
                    title={it.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-sidebar-text)',
                      textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.10)'; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="material-icons" style={{ fontSize: 20, flexShrink: 0 }}>{it.icon}</span>
                    {!sidebarCollapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>{it.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--color-sidebar-border)' }}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
              border: 'none', borderRadius: 10, background: 'transparent', color: 'var(--color-sidebar-text-muted)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.10)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-sidebar-text)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-sidebar-text-muted)'; }}
          >
            <span className="material-icons" style={{ fontSize: 20 }}>{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}</span>
            {!sidebarCollapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* ── Columna derecha: header + banner + contenido ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {showSyncBanner && (
          <div className="px-4 py-3 flex flex-wrap items-center gap-3"
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

        {/* ── Header ── */}
        <header
          className="flex items-center gap-2 sm:gap-4"
          style={{ height: 64, flexShrink: 0, padding: '0 16px', background: 'var(--color-header-bg)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="hidden sm:block" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {navGroups.flatMap((g) => g.items).find((it) => (it.end ? location.pathname === it.to : location.pathname.startsWith(it.to)))?.label ?? 'Flota GPJ'}
          </div>
          <div className="hidden md:block" style={{ position: 'relative', width: 260, marginLeft: 8 }}>
            <span className="material-icons" style={{ position: 'absolute', left: 11, top: 8, fontSize: 18, color: 'var(--color-text-muted)' }}>search</span>
            <input
              placeholder="Buscar placa, folio, conductor…"
              className="input-field"
              style={{ paddingLeft: 38, fontSize: 13 }}
            />
          </div>
          <div className="flex-1" />

          {/* Toggle de tema */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-soft)')}
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
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-soft)')}
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
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAsReadMutation.mutate()}
                          disabled={markAllAsReadMutation.isPending}
                          className="text-xs font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                          style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)' }}
                        >
                          {markAllAsReadMutation.isPending ? 'Marcando…' : 'Marcar todas como leídas'}
                        </button>
                      )}
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
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-soft)')}
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
                <span className="material-icons" style={{ color: 'var(--color-text-muted)' }}>{userMenuOpen ? 'expand_less' : 'expand_more'}</span>
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg transition-colors lg:hidden"
            style={{ color: 'var(--color-text)' }}
            aria-label="Abrir menú"
          >
            <span className="material-icons text-2xl">menu</span>
          </button>
        </header>

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
        <main style={{ flex: 1, overflowY: 'auto', padding: '26px 28px 48px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>

        {/* ── Footer ── */}
        <footer style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '20px 28px', borderTop: '1px solid var(--color-border)' }}>
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
    </div>
  );
}

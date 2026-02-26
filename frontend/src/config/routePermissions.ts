/**
 * Mapeo de ruta a permiso mínimo necesario para verla.
 * Las rutas no listadas (ej. Dashboard, Perfil) se tratan aparte en el layout.
 */
export const ROUTE_PERMISSION: Record<
  string,
  { resource: string; action: string }
> = {
  '/vehicles': { resource: 'vehicles', action: 'read' },
  '/reservations': { resource: 'reservations', action: 'read' },
  '/maintenance': { resource: 'maintenance', action: 'read' },
  '/incidents': { resource: 'incidents', action: 'read' },
  '/sanctions': { resource: 'sanctions', action: 'read' },
  '/users': { resource: 'users', action: 'read' },
  '/providers': { resource: 'providers', action: 'read' },
  '/reports': { resource: 'reports', action: 'read' },
  '/role-permissions': { resource: 'roles', action: 'read' },
  '/system-settings': { resource: 'system_settings', action: 'read' },
  '/fuel-records': { resource: 'fuel_records', action: 'read' },
};

/**
 * Orden y etiquetas de categorías del menú Administración.
 */
export const ADMIN_MENU_CATEGORIES: { key: string; label: string }[] = [
  { key: 'flota', label: 'Flota' },
  { key: 'usuarios', label: 'Usuarios y proveedores' },
  { key: 'sistema', label: 'Sistema' },
];

export type AdminRouteItem = {
  to: string;
  label: string;
  resource: string;
  action: string;
  icon: string;
  category: string;
};

/**
 * Rutas de administración (menú) con etiqueta, permiso, icono y categoría.
 */
export const ADMIN_ROUTE_ITEMS: AdminRouteItem[] = [
  { to: '/vehicles', label: 'Gestión de Vehículos', resource: 'vehicles', action: 'read', icon: 'directions_car', category: 'flota' },
  { to: '/reservations', label: 'Gestión de Reservas', resource: 'reservations', action: 'read', icon: 'event_note', category: 'flota' },
  { to: '/maintenance', label: 'Gestión de Mantenimientos', resource: 'maintenance', action: 'read', icon: 'build', category: 'flota' },
  { to: '/fuel-records', label: 'Registros de combustible', resource: 'fuel_records', action: 'read', icon: 'local_gas_station', category: 'flota' },
  { to: '/incidents', label: 'Incidentes', resource: 'incidents', action: 'read', icon: 'warning', category: 'flota' },
  { to: '/sanctions', label: 'Sanciones', resource: 'sanctions', action: 'read', icon: 'gavel', category: 'flota' },
  { to: '/users', label: 'Gestión de Usuarios', resource: 'users', action: 'read', icon: 'people', category: 'usuarios' },
  { to: '/providers', label: 'Gestión de Proveedores', resource: 'providers', action: 'read', icon: 'business', category: 'usuarios' },
  { to: '/reports', label: 'Reportes y Estadísticas', resource: 'reports', action: 'read', icon: 'bar_chart', category: 'sistema' },
  { to: '/role-permissions', label: 'Permisos por rol', resource: 'roles', action: 'read', icon: 'lock', category: 'sistema' },
  { to: '/system-settings', label: 'Configuración del sistema', resource: 'system_settings', action: 'read', icon: 'settings', category: 'sistema' },
];

/**
 * Comprueba si el usuario puede ver "Solicitud de vehículos" o "Mis solicitudes":
 * tiene reservations:read o reservations:create, o es admin (acceso total).
 */
export function canAccessReservationRequests(
  permissions: { resource: string; action: string }[] | undefined,
  roleName?: string | null,
): boolean {
  const role = roleName?.toLowerCase();
  if (role === 'admin') return true;
  if (role === 'conductor') return true;
  const perms = permissions ?? [];
  return (
    perms.some((p) => p.resource === 'reservations' && p.action === 'read') ||
    perms.some((p) => p.resource === 'reservations' && p.action === 'create')
  );
}

/**
 * Comprueba si el usuario puede ver el Dashboard:
 * tiene al menos vehicles:read o reservations:read, o es admin/conductor (acceso).
 */
export function canAccessDashboard(
  permissions: { resource: string; action: string }[] | undefined,
  roleName?: string | null,
): boolean {
  const role = roleName?.toLowerCase();
  if (role === 'admin') return true;
  if (role === 'conductor') return true;
  const perms = permissions ?? [];
  return (
    perms.some((p) => p.resource === 'vehicles' && p.action === 'read') ||
    perms.some((p) => p.resource === 'reservations' && p.action === 'read')
  );
}

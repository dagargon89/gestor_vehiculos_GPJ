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
};

/**
 * Rutas de administración (menú) con su etiqueta y permiso.
 */
export const ADMIN_ROUTE_ITEMS: { to: string; label: string; resource: string; action: string }[] = [
  { to: '/vehicles', label: 'Gestión de Vehículos', resource: 'vehicles', action: 'read' },
  { to: '/reservations', label: 'Gestión de Reservas', resource: 'reservations', action: 'read' },
  { to: '/maintenance', label: 'Gestión de Mantenimientos', resource: 'maintenance', action: 'read' },
  { to: '/incidents', label: 'Incidentes', resource: 'incidents', action: 'read' },
  { to: '/sanctions', label: 'Sanciones', resource: 'sanctions', action: 'read' },
  { to: '/users', label: 'Gestión de Usuarios', resource: 'users', action: 'read' },
  { to: '/providers', label: 'Gestión de Proveedores', resource: 'providers', action: 'read' },
  { to: '/reports', label: 'Reportes y Estadísticas', resource: 'reports', action: 'read' },
  { to: '/role-permissions', label: 'Permisos por rol', resource: 'roles', action: 'read' },
  { to: '/system-settings', label: 'Configuración del sistema', resource: 'system_settings', action: 'read' },
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

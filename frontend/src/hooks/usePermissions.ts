import { useAuth } from '../contexts/AuthContext';

const CONDUCTOR_DEFAULT_PERMISSIONS: { resource: string; action: string }[] = [
  { resource: 'vehicles', action: 'read' },
  { resource: 'vehicles', action: 'create' },
  { resource: 'vehicles', action: 'update' },
  { resource: 'reservations', action: 'read' },
  { resource: 'reservations', action: 'create' },
  { resource: 'reservations', action: 'update' },
  { resource: 'fuel_records', action: 'read' },
  { resource: 'fuel_records', action: 'create' },
  { resource: 'fuel_records', action: 'update' },
  { resource: 'incidents', action: 'read' },
  { resource: 'incidents', action: 'create' },
  { resource: 'incidents', action: 'update' },
];

function can(
  permissions: { resource: string; action: string }[] | undefined,
  resource: string,
  action: string,
  roleName?: string | null,
): boolean {
  const perms = permissions ?? [];
  if (perms.length > 0) {
    return perms.some((p) => p.resource === resource && p.action === action);
  }
  const role = roleName?.toLowerCase();
  if (role === 'admin') return true;
  if (role === 'conductor') {
    return CONDUCTOR_DEFAULT_PERMISSIONS.some(
      (p) => p.resource === resource && p.action === action,
    );
  }
  return false;
}

export function usePermissions() {
  const { userData } = useAuth();
  const permissions = userData?.permissions ?? [];
  const roleName = userData?.role?.name;
  const canDo = (res: string, act: string) =>
    can(permissions, res, act, roleName);
  return { can: canDo, permissions };
}

export function useCan(resource: string, action: string): boolean {
  const { userData } = useAuth();
  return can(
    userData?.permissions,
    resource,
    action,
    userData?.role?.name,
  );
}

export { can };

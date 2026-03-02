import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';

type Permission = { resource: string; action: string };

interface PermissionRouteProps {
  children: React.ReactNode;
  /** Permiso único requerido (recurso + acción). */
  resource?: string;
  action?: string;
  /** O bien: al menos uno de estos permisos. */
  oneOf?: Permission[];
  /**
   * Roles que siempre tienen acceso a esta ruta, independientemente
   * de los permisos asignados. Usar para rutas esenciales del conductor
   * que deben ser ajenas al sistema de permisos administrativos.
   */
  bypassForRoles?: string[];
}

/**
 * Protege una ruta por permiso: si el usuario no tiene el permiso (o ninguno de oneOf),
 * redirige a la raíz.
 * Si el rol del usuario está en bypassForRoles, se omite la verificación de permisos.
 */
export function PermissionRoute({
  children,
  resource,
  action,
  oneOf,
  bypassForRoles,
}: PermissionRouteProps) {
  const { can } = usePermissions();
  const { userData } = useAuth();

  const roleName = userData?.role?.name?.toLowerCase();
  if (bypassForRoles && roleName && bypassForRoles.includes(roleName)) {
    return <>{children}</>;
  }

  const allowed =
    oneOf !== undefined
      ? oneOf.some((p) => can(p.resource, p.action))
      : resource !== undefined && action !== undefined && can(resource, action);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

type Permission = { resource: string; action: string };

interface PermissionRouteProps {
  children: React.ReactNode;
  /** Permiso único requerido (recurso + acción). */
  resource?: string;
  action?: string;
  /** O bien: al menos uno de estos permisos. */
  oneOf?: Permission[];
}

/**
 * Protege una ruta por permiso: si el usuario no tiene el permiso (o ninguno de oneOf),
 * redirige a la raíz.
 */
export function PermissionRoute({
  children,
  resource,
  action,
  oneOf,
}: PermissionRouteProps) {
  const { can } = usePermissions();

  const allowed =
    oneOf !== undefined
      ? oneOf.some((p) => can(p.resource, p.action))
      : resource !== undefined && action !== undefined && can(resource, action);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

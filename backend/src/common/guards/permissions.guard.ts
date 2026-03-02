import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/** Permisos que siempre tiene un conductor, independientemente de los permisos
 *  explícitos que tenga asignados en base de datos. */
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
  { resource: 'notifications', action: 'read' },
];

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<{ resource: string; action: string }>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    if (!user) throw new ForbiddenException('No autorizado');

    const roleName = user.role?.name?.toLowerCase();

    // Admin bypasses all permission checks
    if (roleName === 'admin') return true;

    const explicit = (user.permissions ?? []) as { resource: string; action: string }[];

    // Conductors always have their default permissions merged with any explicit ones
    const effective =
      roleName === 'conductor'
        ? [
            ...explicit,
            ...CONDUCTOR_DEFAULT_PERMISSIONS.filter(
              (dp) => !explicit.some((ep) => ep.resource === dp.resource && ep.action === dp.action),
            ),
          ]
        : explicit;

    const hasPermission = effective.some(
      (p) => p.resource === required.resource && p.action === required.action,
    );
    if (!hasPermission) throw new ForbiddenException('Sin permiso para esta acción');
    return true;
  }
}

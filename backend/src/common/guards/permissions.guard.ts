import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

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
    const user = request.user as CurrentUserPayload & { permissions?: { resource: string; action: string }[] };
    if (!user) throw new ForbiddenException('No autorizado');

    const permissions = (user as { permissions?: { resource: string; action: string }[] }).permissions || [];
    const hasPermission = permissions.some(
      (p) => p.resource === required.resource && p.action === required.action,
    );
    if (!hasPermission) throw new ForbiddenException('Sin permiso para esta acción');
    return true;
  }
}

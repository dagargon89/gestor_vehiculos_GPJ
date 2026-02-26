import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firebaseAuth } from '../../config/firebase-admin.config';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    const token = authHeader.split('Bearer ')[1];

    if (!firebaseAuth) {
      throw new UnauthorizedException('Firebase no configurado');
    }

    try {
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      const firebaseUid = decodedToken.uid;

      let user = await this.usersService.findByFirebaseUid(firebaseUid);

      if (!user) {
        this.logger.log('Creando usuario en BD desde Firebase');
        user = await this.usersService.createFromFirebase({
          firebaseUid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || null,
          photoURL: decodedToken.picture || null,
        });
      }

      try {
        await this.usersService.updateLastLogin(user.id);
      } catch (lastLoginErr) {
        this.logger.warn('updateLastLogin falló (no bloqueante):', (lastLoginErr as Error)?.message);
      }
      const userWithPermissions = await this.usersService.findOneWithPermissions(user.id);

      if (userWithPermissions.status !== 'active') {
        throw new UnauthorizedException('Usuario suspendido o inactivo');
      }

      const role = userWithPermissions.role;
      const permissions = Array.isArray((userWithPermissions as { permissions?: unknown }).permissions)
        ? (userWithPermissions as { permissions: { resource: string; action: string }[] }).permissions
        : [];
      request.user = {
        ...userWithPermissions,
        role: role != null ? { id: role.id, name: role.name } : null,
        permissions,
      };
      request.firebaseToken = decodedToken;
      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const error = err as { code?: string; message?: string; stack?: string };
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token expirado');
      }
      if (error.code && String(error.code).startsWith('auth/')) {
        throw new UnauthorizedException('Token inválido');
      }
      const msg = error.message ?? String(err);
      this.logger.error(`Error en autenticación/creación de usuario: ${msg}`, error.stack);
      // En desarrollo, incluir el mensaje real para depuración
      const isDev = process.env.NODE_ENV !== 'production';
      throw new InternalServerErrorException(
        isDev ? `Error al crear o obtener usuario: ${msg}` : 'Error al crear o obtener usuario',
      );
    }
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { firebaseAuth } from '../../config/firebase-admin.config';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
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
        user = await this.usersService.createFromFirebase({
          firebaseUid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || null,
          photoURL: decodedToken.picture || null,
        });
      }

      await this.usersService.updateLastLogin(user.id);
      const userWithPermissions = await this.usersService.findOneWithPermissions(user.id);

      if (userWithPermissions.status !== 'active') {
        throw new UnauthorizedException('Usuario suspendido o inactivo');
      }

      request.user = userWithPermissions;
      request.firebaseToken = decodedToken;
      return true;
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token expirado');
      }
      throw new UnauthorizedException('Token inválido');
    }
  }
}

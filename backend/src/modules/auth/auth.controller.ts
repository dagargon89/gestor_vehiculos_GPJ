import { Controller, Get, Post, Delete, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    const u = user as CurrentUserPayload & { role?: { id?: string; name?: string }; permissions?: { resource: string; action: string }[] };
    const role = u.role != null ? { id: u.role.id ?? null, name: u.role.name ?? '' } : null;
    const permissions = Array.isArray(u.permissions) ? u.permissions : [];
    const payload = {
      id: u.id,
      firebaseUid: u.firebaseUid,
      email: u.email,
      displayName: u.displayName ?? null,
      photoUrl: u.photoUrl ?? null,
      roleId: u.roleId ?? null,
      role,
      status: u.status,
      permissions,
    };
    this.logger.log(`/auth/me: userId=${u.id} role=${role?.name ?? 'null'} permissionsCount=${permissions.length}`);
    return payload;
  }

  @Post('sync-user')
  @UseGuards(FirebaseAuthGuard)
  syncUser(@CurrentUser() user: CurrentUserPayload, @Body() body: Record<string, unknown>) {
    return this.authService.updateUserData(user.id, body);
  }

  @Delete('account')
  @UseGuards(FirebaseAuthGuard)
  async deleteAccount(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.deleteAccount(user.id, user.firebaseUid);
    return { message: 'Cuenta eliminada exitosamente' };
  }
}

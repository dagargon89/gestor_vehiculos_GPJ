import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    return user;
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

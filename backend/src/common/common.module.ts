import { Global, Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { UsersModule } from '../modules/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [FirebaseAuthGuard, PermissionsGuard],
  exports: [FirebaseAuthGuard, PermissionsGuard, UsersModule],
})
export class CommonModule {}

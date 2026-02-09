import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async updateUserData(userId: string, data: Record<string, unknown>) {
    return this.usersService.updateUserData(userId, data as Parameters<typeof this.usersService.updateUserData>[1]);
  }

  async deleteAccount(userId: string, _firebaseUid: string): Promise<void> {
    await this.usersService.updateUserData(userId, { status: 'inactive' } as never);
  }
}

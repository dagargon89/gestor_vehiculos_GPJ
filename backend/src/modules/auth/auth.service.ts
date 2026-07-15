import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SyncUserDto } from './dto/sync-user.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async updateUserData(userId: string, data: SyncUserDto) {
    return this.usersService.updateOwnProfile(userId, data as Partial<Parameters<typeof this.usersService.updateOwnProfile>[1]>);
  }

  async deleteAccount(userId: string, _firebaseUid: string): Promise<void> {
    await this.usersService.updateUserData(userId, { status: 'inactive' } as never);
  }

}

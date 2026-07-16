import { UsersService } from '../users/users.service';
import { SyncUserDto } from './dto/sync-user.dto';
export declare class AuthService {
    private usersService;
    constructor(usersService: UsersService);
    updateUserData(userId: string, data: SyncUserDto): Promise<import("../../database/entities/user.entity").User>;
    deleteAccount(userId: string, _firebaseUid: string): Promise<void>;
}

import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    constructor(usersService: UsersService);
    updateUserData(userId: string, data: Record<string, unknown>): Promise<import("../../database/entities/user.entity").User>;
    deleteAccount(userId: string, _firebaseUid: string): Promise<void>;
    claimAdmin(userId: string): Promise<{
        success: true;
    }>;
}

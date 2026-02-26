import { AuthService } from './auth.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    getCurrentUser(user: CurrentUserPayload): {
        id: string;
        firebaseUid: string;
        email: string;
        displayName: string | null;
        photoUrl: string | null;
        roleId: string | null;
        role: {
            id: string | null;
            name: string;
        } | null;
        status: string;
        permissions: {
            resource: string;
            action: string;
        }[] & {
            resource: string;
            action: string;
        }[];
    };
    syncUser(user: CurrentUserPayload, body: Record<string, unknown>): Promise<import("../../database/entities/user.entity").User>;
    deleteAccount(user: CurrentUserPayload): Promise<{
        message: string;
    }>;
}

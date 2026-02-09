import { AuthService } from './auth.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    getCurrentUser(user: CurrentUserPayload): CurrentUserPayload;
    syncUser(user: CurrentUserPayload, body: Record<string, unknown>): Promise<import("../../database/entities/user.entity").User>;
    deleteAccount(user: CurrentUserPayload): Promise<{
        message: string;
    }>;
}

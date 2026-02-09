import { UsersService } from './users.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    me(user: CurrentUserPayload): CurrentUserPayload;
    findAll(): Promise<import("../../database/entities/user.entity").User[]>;
    findOne(id: string): Promise<import("../../database/entities/user.entity").User>;
    create(body: Record<string, unknown>): Promise<import("../../database/entities/user.entity").User>;
    update(id: string, body: Record<string, unknown>): Promise<import("../../database/entities/user.entity").User>;
    remove(id: string): Promise<void>;
}

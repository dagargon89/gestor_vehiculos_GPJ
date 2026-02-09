import { UsersService } from './users.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    me(user: CurrentUserPayload): CurrentUserPayload;
    findOne(id: string): Promise<import("../../database/entities/user.entity").User>;
}

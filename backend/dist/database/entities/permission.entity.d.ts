import { Role } from './role.entity';
export declare class Permission {
    id: string;
    resource: string;
    action: string;
    roles: Role[];
}

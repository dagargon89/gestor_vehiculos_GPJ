import { RolesService } from './roles.service';
export declare class RolesController {
    private rolesService;
    constructor(rolesService: RolesService);
    findAll(): Promise<import("../../database/entities/role.entity").Role[]>;
    findOne(id: string): Promise<import("../../database/entities/role.entity").Role>;
    create(body: {
        name: string;
        description?: string;
        permissionIds?: string[];
    }): Promise<import("../../database/entities/role.entity").Role>;
    update(id: string, body: Partial<{
        name: string;
        description: string;
        permissionIds: string[];
    }>): Promise<import("../../database/entities/role.entity").Role>;
    remove(id: string): Promise<void>;
}

import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private permissionsService;
    constructor(permissionsService: PermissionsService);
    findAll(): Promise<import("../../database/entities/permission.entity").Permission[]>;
    findOne(id: string): Promise<import("../../database/entities/permission.entity").Permission>;
    create(body: {
        resource: string;
        action: string;
    }): Promise<import("../../database/entities/permission.entity").Permission>;
    update(id: string, body: Partial<{
        resource: string;
        action: string;
    }>): Promise<import("../../database/entities/permission.entity").Permission>;
    remove(id: string): Promise<void>;
}

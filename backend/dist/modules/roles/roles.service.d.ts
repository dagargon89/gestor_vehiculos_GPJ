import { Repository } from 'typeorm';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
export declare class RolesService {
    private roleRepo;
    private permissionRepo;
    constructor(roleRepo: Repository<Role>, permissionRepo: Repository<Permission>);
    findAll(): Promise<Role[]>;
    findOne(id: string): Promise<Role>;
    create(data: {
        name: string;
        description?: string;
        permissionIds?: string[];
    }): Promise<Role>;
    update(id: string, data: Partial<{
        name: string;
        description: string;
        permissionIds: string[];
    }>): Promise<Role>;
    remove(id: string): Promise<void>;
}

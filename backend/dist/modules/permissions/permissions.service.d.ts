import { Repository } from 'typeorm';
import { Permission } from '../../database/entities/permission.entity';
export declare class PermissionsService {
    private permissionRepo;
    constructor(permissionRepo: Repository<Permission>);
    findAll(): Promise<Permission[]>;
    findOne(id: string): Promise<Permission>;
    create(data: {
        resource: string;
        action: string;
    }): Promise<Permission>;
    update(id: string, data: Partial<Pick<Permission, 'resource' | 'action'>>): Promise<Permission>;
    remove(id: string): Promise<void>;
}

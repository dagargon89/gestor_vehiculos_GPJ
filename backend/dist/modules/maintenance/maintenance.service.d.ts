import { Repository } from 'typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';
export declare class MaintenanceService {
    private repo;
    constructor(repo: Repository<Maintenance>);
    findAll(filters?: {
        vehicleId?: string;
        status?: string;
    }): Promise<Maintenance[]>;
    findOne(id: string): Promise<Maintenance>;
    create(data: Partial<Maintenance>): Promise<Maintenance>;
    update(id: string, data: Partial<Maintenance>): Promise<Maintenance>;
    remove(id: string): Promise<void>;
}

import { Repository } from 'typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
export declare class MaintenanceService {
    private repo;
    private vehiclesService;
    constructor(repo: Repository<Maintenance>, vehiclesService: VehiclesService);
    findAll(filters?: {
        vehicleId?: string;
        status?: string;
    }): Promise<Maintenance[]>;
    findOne(id: string): Promise<Maintenance>;
    create(data: Partial<Maintenance>): Promise<Maintenance>;
    update(id: string, data: Partial<Maintenance>): Promise<Maintenance>;
    private scheduleNextService;
    remove(id: string): Promise<void>;
}

import { MaintenanceService } from './maintenance.service';
import { Maintenance } from '../../database/entities/maintenance.entity';
export declare class MaintenanceController {
    private maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    findAll(vehicleId?: string, status?: string): Promise<Maintenance[]>;
    findOne(id: string): Promise<Maintenance>;
    create(body: Partial<Maintenance>): Promise<Maintenance>;
    update(id: string, body: Partial<Maintenance>): Promise<Maintenance>;
    remove(id: string): Promise<void>;
}

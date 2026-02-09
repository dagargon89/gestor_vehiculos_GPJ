import { FuelRecordsService } from './fuel-records.service';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
export declare class FuelRecordsController {
    private fuelRecordsService;
    constructor(fuelRecordsService: FuelRecordsService);
    findAll(vehicleId?: string): Promise<FuelRecord[]>;
    findOne(id: string): Promise<FuelRecord>;
    create(body: Partial<FuelRecord>): Promise<FuelRecord>;
    update(id: string, body: Partial<FuelRecord>): Promise<FuelRecord>;
    remove(id: string): Promise<void>;
}

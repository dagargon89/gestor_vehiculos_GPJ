import { Repository } from 'typeorm';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
export declare class FuelRecordsService {
    private repo;
    constructor(repo: Repository<FuelRecord>);
    findAll(vehicleId?: string): Promise<FuelRecord[]>;
    findOne(id: string): Promise<FuelRecord>;
    create(data: Partial<FuelRecord>): Promise<FuelRecord>;
    update(id: string, data: Partial<FuelRecord>): Promise<FuelRecord>;
    remove(id: string): Promise<void>;
}

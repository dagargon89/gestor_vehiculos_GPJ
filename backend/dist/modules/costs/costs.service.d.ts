import { Repository } from 'typeorm';
import { Cost } from '../../database/entities/cost.entity';
export declare class CostsService {
    private repo;
    constructor(repo: Repository<Cost>);
    findAll(filters?: {
        vehicleId?: string;
        category?: string;
    }): Promise<Cost[]>;
    findOne(id: string): Promise<Cost>;
    create(data: Partial<Cost>): Promise<Cost>;
    update(id: string, data: Partial<Cost>): Promise<Cost>;
    remove(id: string): Promise<void>;
}

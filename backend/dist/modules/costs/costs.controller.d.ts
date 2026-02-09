import { CostsService } from './costs.service';
import { Cost } from '../../database/entities/cost.entity';
export declare class CostsController {
    private costsService;
    constructor(costsService: CostsService);
    findAll(vehicleId?: string, category?: string): Promise<Cost[]>;
    findOne(id: string): Promise<Cost>;
    create(body: Partial<Cost>): Promise<Cost>;
    update(id: string, body: Partial<Cost>): Promise<Cost>;
    remove(id: string): Promise<void>;
}

import { SanctionsService } from './sanctions.service';
import { Sanction } from '../../database/entities/sanction.entity';
export declare class SanctionsController {
    private sanctionsService;
    constructor(sanctionsService: SanctionsService);
    findAll(userId?: string): Promise<Sanction[]>;
    findOne(id: string): Promise<Sanction>;
    create(body: Partial<Sanction>): Promise<Sanction>;
    update(id: string, body: Partial<Sanction>): Promise<Sanction>;
    remove(id: string): Promise<void>;
}

import { Repository } from 'typeorm';
import { Sanction } from '../../database/entities/sanction.entity';
export declare class SanctionsService {
    private repo;
    constructor(repo: Repository<Sanction>);
    findAll(userId?: string): Promise<Sanction[]>;
    findOne(id: string): Promise<Sanction>;
    create(data: Partial<Sanction>): Promise<Sanction>;
    update(id: string, data: Partial<Sanction>): Promise<Sanction>;
    remove(id: string): Promise<void>;
}

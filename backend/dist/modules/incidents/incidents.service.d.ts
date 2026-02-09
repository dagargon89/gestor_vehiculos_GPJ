import { Repository } from 'typeorm';
import { Incident } from '../../database/entities/incident.entity';
export declare class IncidentsService {
    private repo;
    constructor(repo: Repository<Incident>);
    findAll(filters?: {
        vehicleId?: string;
        userId?: string;
        status?: string;
    }): Promise<Incident[]>;
    findOne(id: string): Promise<Incident>;
    create(data: Partial<Incident>): Promise<Incident>;
    update(id: string, data: Partial<Incident>): Promise<Incident>;
    remove(id: string): Promise<void>;
}

import { Repository } from 'typeorm';
import { Incident } from '../../database/entities/incident.entity';
import { UsersService } from '../users/users.service';
export declare class IncidentsService {
    private repo;
    private usersService;
    constructor(repo: Repository<Incident>, usersService: UsersService);
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

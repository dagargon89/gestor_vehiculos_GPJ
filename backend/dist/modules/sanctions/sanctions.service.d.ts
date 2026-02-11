import { Repository } from 'typeorm';
import { Sanction } from '../../database/entities/sanction.entity';
import { UsersService } from '../users/users.service';
export declare class SanctionsService {
    private repo;
    private usersService;
    constructor(repo: Repository<Sanction>, usersService: UsersService);
    findAll(userId?: string): Promise<Sanction[]>;
    findOne(id: string): Promise<Sanction>;
    create(data: Partial<Sanction>): Promise<Sanction>;
    update(id: string, data: Partial<Sanction>): Promise<Sanction>;
    remove(id: string): Promise<void>;
}

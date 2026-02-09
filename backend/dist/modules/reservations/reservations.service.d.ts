import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
export declare class ReservationsService {
    private repo;
    constructor(repo: Repository<Reservation>);
    findAll(): Promise<Reservation[]>;
    findOne(id: string): Promise<Reservation>;
    create(data: Partial<Reservation>): Promise<Reservation>;
    update(id: string, data: Partial<Reservation>): Promise<Reservation>;
    findOverdue(): Promise<Reservation[]>;
    remove(id: string): Promise<void>;
}

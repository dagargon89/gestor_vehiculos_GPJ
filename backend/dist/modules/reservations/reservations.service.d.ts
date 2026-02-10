import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ReservationsService {
    private repo;
    private vehicleRepo;
    private notificationsService;
    constructor(repo: Repository<Reservation>, vehicleRepo: Repository<Vehicle>, notificationsService: NotificationsService);
    findAll(filters?: {
        status?: string;
        vehicleId?: string;
        userId?: string;
        start?: string;
        end?: string;
    }): Promise<Reservation[]>;
    findOne(id: string): Promise<Reservation>;
    create(data: Partial<Reservation>): Promise<Reservation>;
    update(id: string, data: Partial<Reservation>): Promise<Reservation>;
    findOverdue(): Promise<Reservation[]>;
    remove(id: string): Promise<void>;
    checkIn(id: string, userId: string, odometer: number, fuelPhotoUrl?: string, conditionPhotoUrls?: string[]): Promise<Reservation>;
    checkOut(id: string, userId: string, odometer: number, fuelPhotoUrl?: string, conditionPhotoUrls?: string[]): Promise<Reservation>;
}

import { DataSource, Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { UsersService } from '../users/users.service';
import { SanctionsService } from '../sanctions/sanctions.service';
import { FuelRecordsService } from '../fuel-records/fuel-records.service';
export declare class ReservationsService {
    private repo;
    private vehicleRepo;
    private notificationsService;
    private systemSettingsService;
    private usersService;
    private sanctionsService;
    private fuelRecordsService;
    private dataSource;
    private readonly logger;
    constructor(repo: Repository<Reservation>, vehicleRepo: Repository<Vehicle>, notificationsService: NotificationsService, systemSettingsService: SystemSettingsService, usersService: UsersService, sanctionsService: SanctionsService, fuelRecordsService: FuelRecordsService, dataSource: DataSource);
    findAll(filters?: {
        status?: string;
        vehicleId?: string;
        userId?: string;
        start?: string;
        end?: string;
    }): Promise<Reservation[]>;
    findOne(id: string): Promise<Reservation>;
    create(data: Partial<Reservation>): Promise<Reservation>;
    update(id: string, data: Partial<Reservation>, currentUser: {
        id: string;
        role?: {
            name?: string;
        };
    }): Promise<Reservation>;
    private assertNoConflict;
    findOverdue(): Promise<Reservation[]>;
    findNoCheckIn(): Promise<Reservation[]>;
    remove(id: string): Promise<void>;
    checkIn(id: string, userId: string, odometer: number, fuelPhotoUrl?: string, conditionPhotoUrls?: string[]): Promise<Reservation>;
    checkOut(id: string, userId: string, odometer: number, fuelPhotoUrl?: string, conditionPhotoUrls?: string[], fuelLiters?: number, fuelCost?: number): Promise<Reservation>;
}

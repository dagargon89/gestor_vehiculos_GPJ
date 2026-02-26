import { ReservationsService } from './reservations.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class ReservationsController {
    private reservationsService;
    constructor(reservationsService: ReservationsService);
    findAll(status?: string, vehicleId?: string, userId?: string, start?: string, end?: string): Promise<import("../../database/entities/reservation.entity").Reservation[]>;
    checkIn(id: string, user: CurrentUserPayload, body: {
        odometer: number;
        fuelPhotoUrl?: string;
        conditionPhotoUrls?: string[];
    }): Promise<import("../../database/entities/reservation.entity").Reservation>;
    checkOut(id: string, user: CurrentUserPayload, body: {
        odometer: number;
        fuelPhotoUrl?: string;
        fuelLevel?: string;
        conditionPhotoUrls?: string[];
    }): Promise<import("../../database/entities/reservation.entity").Reservation>;
    findOne(id: string): Promise<import("../../database/entities/reservation.entity").Reservation>;
    create(body: Record<string, unknown>): Promise<import("../../database/entities/reservation.entity").Reservation>;
    update(id: string, body: Record<string, unknown>): Promise<import("../../database/entities/reservation.entity").Reservation>;
    remove(id: string): Promise<void>;
}

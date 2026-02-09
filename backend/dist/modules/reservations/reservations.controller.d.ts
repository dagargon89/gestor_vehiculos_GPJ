import { ReservationsService } from './reservations.service';
export declare class ReservationsController {
    private reservationsService;
    constructor(reservationsService: ReservationsService);
    findAll(status?: string, vehicleId?: string, userId?: string): Promise<import("../../database/entities/reservation.entity").Reservation[]>;
    findOne(id: string): Promise<import("../../database/entities/reservation.entity").Reservation>;
    create(body: Record<string, unknown>): Promise<import("../../database/entities/reservation.entity").Reservation>;
    update(id: string, body: Record<string, unknown>): Promise<import("../../database/entities/reservation.entity").Reservation>;
    remove(id: string): Promise<void>;
}

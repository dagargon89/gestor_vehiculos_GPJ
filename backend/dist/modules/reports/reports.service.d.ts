import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
export declare class ReportsService {
    private reservationsRepo;
    constructor(reservationsRepo: Repository<Reservation>);
    getVehicleUsageReport(startDate: Date, endDate: Date): Promise<unknown[]>;
}

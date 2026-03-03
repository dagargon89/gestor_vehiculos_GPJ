import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { Incident } from '../../database/entities/incident.entity';
export declare class ReportsService {
    private reservationsRepo;
    private fuelRecordsRepo;
    private maintenanceRepo;
    private incidentsRepo;
    constructor(reservationsRepo: Repository<Reservation>, fuelRecordsRepo: Repository<FuelRecord>, maintenanceRepo: Repository<Maintenance>, incidentsRepo: Repository<Incident>);
    getVehicleUsageReport(startDate: Date, endDate: Date): Promise<unknown[]>;
    getDriverActivityReport(startDate: Date, endDate: Date): Promise<unknown[]>;
    getReservationsHistoryReport(startDate: Date, endDate: Date): Promise<unknown[]>;
    getFuelReport(startDate: Date, endDate: Date): Promise<unknown[]>;
    getMaintenanceReport(startDate: Date, endDate: Date): Promise<unknown[]>;
}

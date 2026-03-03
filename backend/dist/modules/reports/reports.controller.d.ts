import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    private parseDates;
    getVehicleUsage(startDate: string, endDate: string): Promise<unknown[]>;
    getDriverActivity(startDate: string, endDate: string): Promise<unknown[]>;
    getReservationsHistory(startDate: string, endDate: string): Promise<unknown[]>;
    getFuel(startDate: string, endDate: string): Promise<unknown[]>;
    getMaintenance(startDate: string, endDate: string): Promise<unknown[]>;
}

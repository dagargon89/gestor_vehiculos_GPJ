import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getVehicleUsage(startDate: string, endDate: string): Promise<unknown[]>;
}

import { IncidentsService } from './incidents.service';
import { Incident } from '../../database/entities/incident.entity';
export declare class IncidentsController {
    private incidentsService;
    constructor(incidentsService: IncidentsService);
    findAll(vehicleId?: string, userId?: string, status?: string): Promise<Incident[]>;
    findOne(id: string): Promise<Incident>;
    create(body: Partial<Incident>): Promise<Incident>;
    update(id: string, body: Partial<Incident>): Promise<Incident>;
    remove(id: string): Promise<void>;
}

import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Reservation } from '../../database/entities/reservation.entity';
export type VehicleWithLastUse = Vehicle & {
    lastFuelLevel?: string | null;
    lastUsedByUser?: string | null;
};
export declare class VehiclesService {
    private vehicleRepo;
    private reservationRepo;
    constructor(vehicleRepo: Repository<Vehicle>, reservationRepo: Repository<Reservation>);
    findAll(status?: string): Promise<VehicleWithLastUse[]>;
    findOne(id: string): Promise<VehicleWithLastUse>;
    create(data: Partial<Vehicle>): Promise<Vehicle>;
    update(id: string, data: Partial<Vehicle>): Promise<Vehicle>;
    remove(id: string): Promise<void>;
    addPhoto(id: string, photoUrl: string): Promise<Vehicle>;
}

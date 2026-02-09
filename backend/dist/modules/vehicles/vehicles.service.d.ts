import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
export declare class VehiclesService {
    private vehicleRepo;
    constructor(vehicleRepo: Repository<Vehicle>);
    findAll(): Promise<Vehicle[]>;
    findOne(id: string): Promise<Vehicle>;
    create(data: Partial<Vehicle>): Promise<Vehicle>;
    update(id: string, data: Partial<Vehicle>): Promise<Vehicle>;
    remove(id: string): Promise<void>;
    addPhoto(id: string, photoUrl: string): Promise<Vehicle>;
}

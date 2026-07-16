import { Vehicle } from './vehicle.entity';
export declare class FuelRecord {
    id: string;
    vehicle: Vehicle;
    vehicleId: string;
    date: Date;
    liters: number;
    cost: number;
    odometer: number;
    createdAt: Date;
    deletedAt: Date;
}

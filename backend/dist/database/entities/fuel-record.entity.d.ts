import { Vehicle } from './vehicle.entity';
export declare class FuelRecord {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    date: Date;
    liters: number;
    cost: number;
    odometer: number;
    createdAt: Date;
    deletedAt: Date;
}

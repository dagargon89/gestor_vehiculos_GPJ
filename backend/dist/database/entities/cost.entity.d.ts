import { Vehicle } from './vehicle.entity';
export declare class Cost {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    category: string;
    amount: number;
    date: Date;
    description: string;
    createdAt: Date;
    deletedAt: Date;
}

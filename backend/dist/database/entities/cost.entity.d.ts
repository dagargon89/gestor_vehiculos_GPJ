import { Vehicle } from './vehicle.entity';
export declare class Cost {
    id: string;
    vehicle: Vehicle;
    vehicleId: string;
    category: string;
    amount: number;
    date: Date;
    description: string;
    createdAt: Date;
    deletedAt: Date;
}

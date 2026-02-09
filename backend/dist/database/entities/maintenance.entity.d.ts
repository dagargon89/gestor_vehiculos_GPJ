import { Vehicle } from './vehicle.entity';
export declare class Maintenance {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    scheduledDate: Date;
    type: string;
    description: string;
    status: string;
    odometerAtService: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

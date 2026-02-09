import { Vehicle } from './vehicle.entity';
import { User } from './user.entity';
export declare class Incident {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    userId: string;
    user: User;
    date: Date;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

import { Vehicle } from './vehicle.entity';
import { User } from './user.entity';
export declare class Incident {
    id: string;
    vehicle: Vehicle;
    vehicleId: string;
    user: User;
    userId: string;
    date: Date;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

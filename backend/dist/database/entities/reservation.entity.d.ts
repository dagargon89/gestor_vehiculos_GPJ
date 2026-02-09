import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
export declare class Reservation {
    id: string;
    userId: string;
    user: User;
    vehicleId: string;
    vehicle: Vehicle;
    startDatetime: Date;
    endDatetime: Date;
    status: string;
    checkinOdometer: number;
    checkoutOdometer: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

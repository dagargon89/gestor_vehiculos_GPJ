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
    eventName: string;
    description: string;
    destination: string;
    checkinOdometer: number;
    checkinFuelPhotoUrl: string;
    checkinConditionPhotoUrls: string;
    checkoutOdometer: number;
    checkoutFuelPhotoUrl: string;
    checkoutConditionPhotoUrls: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

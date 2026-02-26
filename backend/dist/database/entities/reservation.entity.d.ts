import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
export declare class Reservation {
    id: string;
    user: User;
    userId: string;
    vehicle: Vehicle;
    vehicleId: string;
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
    checkoutFuelLevel: string;
    checkoutConditionPhotoUrls: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

import { Reservation } from './reservation.entity';
export declare class Vehicle {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    vin: string;
    photoUrls: string;
    status: string;
    currentOdometer: number;
    maintenanceIntervalKm: number;
    maintenanceIntervalDays: number;
    nextServiceOdometer: number;
    nextServiceDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    reservations: Reservation[];
}

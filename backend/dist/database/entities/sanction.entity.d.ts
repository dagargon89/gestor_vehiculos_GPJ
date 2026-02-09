import { User } from './user.entity';
export declare class Sanction {
    id: string;
    userId: string;
    user: User;
    reason: string;
    effectiveDate: Date;
    endDate: Date;
    createdAt: Date;
    deletedAt: Date;
}

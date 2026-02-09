import { User } from './user.entity';
export declare class Notification {
    id: string;
    userId: string;
    user: User;
    type: string;
    title: string;
    message: string;
    read: boolean;
    actionUrl: string;
    createdAt: Date;
}

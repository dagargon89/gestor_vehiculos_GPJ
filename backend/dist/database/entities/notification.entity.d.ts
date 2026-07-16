import { User } from './user.entity';
export declare class Notification {
    id: string;
    user: User;
    userId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    actionUrl: string;
    createdAt: Date;
}

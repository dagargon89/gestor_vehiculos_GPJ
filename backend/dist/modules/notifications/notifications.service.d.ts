import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
export declare class NotificationsService {
    private repo;
    constructor(repo: Repository<Notification>);
    findAll(userId?: string, read?: boolean): Promise<Notification[]>;
    findOne(id: string): Promise<Notification>;
    create(data: Partial<Notification>): Promise<Notification>;
    update(id: string, data: Partial<Notification>): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    remove(id: string): Promise<void>;
}

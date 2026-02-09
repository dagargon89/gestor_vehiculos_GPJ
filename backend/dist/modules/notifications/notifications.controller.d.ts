import { NotificationsService } from './notifications.service';
import { Notification } from '../../database/entities/notification.entity';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId?: string, read?: string): Promise<Notification[]>;
    findOne(id: string): Promise<Notification>;
    create(body: Partial<Notification>): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    update(id: string, body: Partial<Notification>): Promise<Notification>;
    remove(id: string): Promise<void>;
}

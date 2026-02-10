import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
export declare class NotificationsService {
    private repo;
    private userRepo;
    private mailService;
    private readonly logger;
    constructor(repo: Repository<Notification>, userRepo: Repository<User>, mailService: MailService);
    notifyUser(userId: string, type: string, title: string, message: string, actionUrl?: string): Promise<Notification>;
    findAll(userId?: string, read?: boolean): Promise<Notification[]>;
    findOne(id: string): Promise<Notification>;
    create(data: Partial<Notification>): Promise<Notification>;
    update(id: string, data: Partial<Notification>): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    remove(id: string): Promise<void>;
}

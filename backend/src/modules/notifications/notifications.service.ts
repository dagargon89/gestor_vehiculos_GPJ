import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailService: MailService,
  ) {}

  async notifyUser(
    userId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<Notification> {
    const notification = this.repo.create({
      userId,
      type,
      title,
      message,
      actionUrl,
    });
    const saved = await this.repo.save(notification);

    this.userRepo.findOne({ where: { id: userId }, select: ['email', 'emailNotifications'] }).then((user) => {
      if (!user?.email || user.emailNotifications !== true) return;
      this.mailService.send(user.email, title, message).catch((err) => {
        this.logger.warn(`Email send failed for ${userId}: ${err instanceof Error ? err.message : err}`);
      });
    }).catch((err) => {
      this.logger.warn(`Could not load user ${userId} for email: ${err instanceof Error ? err.message : err}`);
    });

    return saved;
  }

  async findAll(userId?: string, read?: boolean): Promise<Notification[]> {
    const qb = this.repo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.user', 'u')
      .orderBy('n.createdAt', 'DESC');
    if (userId) qb.andWhere('n.userId = :userId', { userId });
    if (read !== undefined) qb.andWhere('n.read = :read', { read });
    return qb.getMany();
  }

  async findOne(id: string): Promise<Notification> {
    const n = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    return n;
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.repo.update(id, { read: true });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

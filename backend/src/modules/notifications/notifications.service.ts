import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

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

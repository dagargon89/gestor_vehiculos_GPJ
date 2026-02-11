import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../../database/entities/incident.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private repo: Repository<Incident>,
    private usersService: UsersService,
  ) {}

  async findAll(filters?: {
    vehicleId?: string;
    userId?: string;
    status?: string;
  }): Promise<Incident[]> {
    const where: Record<string, string> = {};
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    const list = await this.repo.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['vehicle', 'user'],
      order: { date: 'DESC' },
    });
    for (const i of list) {
      if (i.userId?.trim() && !i.user) {
        try {
          (i as Incident & { user: Incident['user'] }).user = await this.usersService.findOne(i.userId);
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (i as any).user = null;
        }
      }
    }
    return list;
  }

  async findOne(id: string): Promise<Incident> {
    const i = await this.repo.findOne({
      where: { id },
      relations: ['vehicle', 'user'],
    });
    if (!i) throw new NotFoundException('Incidente no encontrado');
    return i;
  }

  async create(data: Partial<Incident>): Promise<Incident> {
    const incident = this.repo.create(data);
    return this.repo.save(incident);
  }

  async update(id: string, data: Partial<Incident>): Promise<Incident> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

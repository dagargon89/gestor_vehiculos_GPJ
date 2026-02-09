import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../../database/entities/incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private repo: Repository<Incident>,
  ) {}

  async findAll(filters?: {
    vehicleId?: string;
    userId?: string;
    status?: string;
  }): Promise<Incident[]> {
    const qb = this.repo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.vehicle', 'v')
      .leftJoinAndSelect('i.user', 'u')
      .orderBy('i.date', 'DESC');
    if (filters?.vehicleId) qb.andWhere('i.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters?.userId) qb.andWhere('i.userId = :userId', { userId: filters.userId });
    if (filters?.status) qb.andWhere('i.status = :status', { status: filters.status });
    return qb.getMany();
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

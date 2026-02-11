import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private repo: Repository<Maintenance>,
  ) {}

  async findAll(filters?: { vehicleId?: string; status?: string }): Promise<Maintenance[]> {
    const where: Record<string, string> = {};
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.status) where.status = filters.status;
    return this.repo.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['vehicle'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Maintenance> {
    const m = await this.repo.findOne({
      where: { id },
      relations: ['vehicle'],
    });
    if (!m) throw new NotFoundException('Mantenimiento no encontrado');
    return m;
  }

  async create(data: Partial<Maintenance>): Promise<Maintenance> {
    const maintenance = this.repo.create(data);
    return this.repo.save(maintenance);
  }

  async update(id: string, data: Partial<Maintenance>): Promise<Maintenance> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

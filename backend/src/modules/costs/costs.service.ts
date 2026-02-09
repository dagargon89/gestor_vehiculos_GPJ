import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cost } from '../../database/entities/cost.entity';

@Injectable()
export class CostsService {
  constructor(
    @InjectRepository(Cost)
    private repo: Repository<Cost>,
  ) {}

  async findAll(filters?: { vehicleId?: string; category?: string }): Promise<Cost[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.vehicle', 'v')
      .orderBy('c.date', 'DESC');
    if (filters?.vehicleId) qb.andWhere('c.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters?.category) qb.andWhere('c.category = :category', { category: filters.category });
    return qb.getMany();
  }

  async findOne(id: string): Promise<Cost> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['vehicle'],
    });
    if (!c) throw new NotFoundException('Costo no encontrado');
    return c;
  }

  async create(data: Partial<Cost>): Promise<Cost> {
    const cost = this.repo.create(data);
    return this.repo.save(cost);
  }

  async update(id: string, data: Partial<Cost>): Promise<Cost> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelRecord } from '../../database/entities/fuel-record.entity';

@Injectable()
export class FuelRecordsService {
  constructor(
    @InjectRepository(FuelRecord)
    private repo: Repository<FuelRecord>,
  ) {}

  async findAll(vehicleId?: string): Promise<FuelRecord[]> {
    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.vehicle', 'v')
      .orderBy('f.date', 'DESC');
    if (vehicleId) qb.andWhere('f.vehicleId = :vehicleId', { vehicleId });
    return qb.getMany();
  }

  async findOne(id: string): Promise<FuelRecord> {
    const f = await this.repo.findOne({
      where: { id },
      relations: ['vehicle'],
    });
    if (!f) throw new NotFoundException('Registro de combustible no encontrado');
    return f;
  }

  async create(data: Partial<FuelRecord>): Promise<FuelRecord> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async update(id: string, data: Partial<FuelRecord>): Promise<FuelRecord> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

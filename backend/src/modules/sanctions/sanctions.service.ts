import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sanction } from '../../database/entities/sanction.entity';

@Injectable()
export class SanctionsService {
  constructor(
    @InjectRepository(Sanction)
    private repo: Repository<Sanction>,
  ) {}

  async findAll(userId?: string): Promise<Sanction[]> {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u')
      .orderBy('s.effectiveDate', 'DESC');
    if (userId) qb.andWhere('s.userId = :userId', { userId });
    return qb.getMany();
  }

  async findOne(id: string): Promise<Sanction> {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!s) throw new NotFoundException('Sanción no encontrada');
    return s;
  }

  async create(data: Partial<Sanction>): Promise<Sanction> {
    const sanction = this.repo.create(data);
    return this.repo.save(sanction);
  }

  async update(id: string, data: Partial<Sanction>): Promise<Sanction> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

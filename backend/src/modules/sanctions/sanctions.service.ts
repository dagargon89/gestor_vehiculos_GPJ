import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sanction } from '../../database/entities/sanction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SanctionsService {
  constructor(
    @InjectRepository(Sanction)
    private repo: Repository<Sanction>,
    private usersService: UsersService,
  ) {}

  async findAll(userId?: string): Promise<Sanction[]> {
    const list = await this.repo.find({
      where: userId ? { userId } : undefined,
      relations: ['user'],
      order: { effectiveDate: 'DESC' },
    });
    for (const s of list) {
      if (s.userId?.trim() && !s.user) {
        try {
          (s as Sanction & { user: Sanction['user'] }).user = await this.usersService.findOne(s.userId);
        } catch {
          (s as Sanction & { user: Sanction['user'] }).user = null;
        }
      }
    }
    return list;
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

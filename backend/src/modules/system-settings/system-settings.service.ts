import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../../database/entities/system-setting.entity';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private repo: Repository<SystemSetting>,
  ) {}

  async findAll(): Promise<SystemSetting[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async findOne(id: string): Promise<SystemSetting> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Configuración no encontrada');
    return s;
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async create(data: { key: string; value: string }): Promise<SystemSetting> {
    const existing = await this.repo.findOne({ where: { key: data.key } });
    if (existing) throw new ConflictException('Ya existe una configuración con esa clave');
    const setting = this.repo.create(data);
    return this.repo.save(setting);
  }

  async update(id: string, data: Partial<{ key: string; value: string }>): Promise<SystemSetting> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

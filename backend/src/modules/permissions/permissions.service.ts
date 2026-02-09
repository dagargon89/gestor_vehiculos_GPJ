import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../database/entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Permission> {
    const p = await this.permissionRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Permiso no encontrado');
    return p;
  }

  async create(data: { resource: string; action: string }): Promise<Permission> {
    const permission = this.permissionRepo.create(data);
    return this.permissionRepo.save(permission);
  }

  async update(id: string, data: Partial<Pick<Permission, 'resource' | 'action'>>): Promise<Permission> {
    await this.permissionRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.permissionRepo.delete(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../../database/entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private repo: Repository<Provider>,
  ) {}

  async findAll(): Promise<Provider[]> {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Provider> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  async create(data: Partial<Provider>): Promise<Provider> {
    const provider = this.repo.create(data);
    return this.repo.save(provider);
  }

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

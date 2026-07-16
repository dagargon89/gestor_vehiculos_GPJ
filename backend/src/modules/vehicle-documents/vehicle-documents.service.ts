import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';

@Injectable()
export class VehicleDocumentsService {
  constructor(
    @InjectRepository(VehicleDocument)
    private repo: Repository<VehicleDocument>,
  ) {}

  async findByVehicle(vehicleId: string): Promise<VehicleDocument[]> {
    return this.repo.find({ where: { vehicleId }, order: { expiryDate: 'ASC' } });
  }

  async findOne(id: string): Promise<VehicleDocument> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async create(data: Partial<VehicleDocument>): Promise<VehicleDocument> {
    const doc = this.repo.create(data);
    return this.repo.save(doc);
  }

  async update(id: string, data: Partial<VehicleDocument>): Promise<VehicleDocument> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

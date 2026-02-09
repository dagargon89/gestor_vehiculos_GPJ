import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepo.find({
      where: {},
      order: { plate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const v = await this.vehicleRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    return v;
  }

  async create(data: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.vehicleRepo.create(data);
    return this.vehicleRepo.save(vehicle);
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    await this.vehicleRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.vehicleRepo.softDelete(id);
  }

  async addPhoto(id: string, photoUrl: string): Promise<Vehicle> {
    const v = await this.findOne(id);
    const urls = v.photoUrls ? `${v.photoUrls},${photoUrl}` : photoUrl;
    return this.update(id, { photoUrls: urls });
  }
}

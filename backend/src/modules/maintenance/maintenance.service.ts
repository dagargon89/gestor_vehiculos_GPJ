import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private repo: Repository<Maintenance>,
    private vehiclesService: VehiclesService,
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
    const saved = await this.repo.save(maintenance);
    if (saved.vehicleId && saved.status === 'scheduled') {
      await this.vehiclesService.update(saved.vehicleId, { status: 'maintenance' } as never);
    }
    return saved;
  }

  async update(id: string, data: Partial<Maintenance>): Promise<Maintenance> {
    await this.repo.update(id, data);
    const updated = await this.findOne(id);
    if (data.status === 'completed') {
      await this.scheduleNextService(updated);
    }
    return updated;
  }

  private async scheduleNextService(maintenance: Maintenance): Promise<void> {
    const vehicle = await this.vehiclesService.findOne(maintenance.vehicleId);
    const patch: Record<string, unknown> = { status: 'available' };
    if (vehicle.maintenanceIntervalKm && maintenance.odometerAtService != null) {
      patch.nextServiceOdometer = maintenance.odometerAtService + vehicle.maintenanceIntervalKm;
    }
    if (vehicle.maintenanceIntervalDays) {
      const next = new Date();
      next.setDate(next.getDate() + vehicle.maintenanceIntervalDays);
      patch.nextServiceDate = next;
    }
    await this.vehiclesService.update(maintenance.vehicleId, patch);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

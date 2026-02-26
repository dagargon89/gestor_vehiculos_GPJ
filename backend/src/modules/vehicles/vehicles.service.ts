import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Reservation } from '../../database/entities/reservation.entity';

export type VehicleWithLastUse = Vehicle & {
  lastFuelLevel?: string | null;
  lastUsedByUser?: string | null;
};

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  async findAll(status?: string): Promise<VehicleWithLastUse[]> {
    const vehicles = await this.vehicleRepo.find({
      where: status ? { status } : {},
      order: { plate: 'ASC' },
    });
    if (vehicles.length === 0) return [];
    const vehicleIds = vehicles.map((v) => v.id);
    const allCompleted = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'completed' })
      .andWhere('r.vehicleId IN (:...ids)', { ids: vehicleIds })
      .leftJoinAndSelect('r.user', 'user')
      .orderBy('r.endDatetime', 'DESC')
      .getMany();
    const byVehicle = new Map<string, { lastFuelLevel: string | null; lastUsedByUser: string | null }>();
    for (const r of allCompleted) {
      if (!byVehicle.has(r.vehicleId)) {
        const user = r.user as { displayName?: string; email?: string } | undefined;
        byVehicle.set(r.vehicleId, {
          lastFuelLevel: r.checkoutFuelLevel ?? null,
          lastUsedByUser: user ? (user.displayName || user.email) || null : null,
        });
      }
    }
    return vehicles.map((v) => {
      const extra = byVehicle.get(v.id);
      return {
        ...v,
        lastFuelLevel: extra?.lastFuelLevel ?? null,
        lastUsedByUser: extra?.lastUsedByUser ?? null,
      };
    });
  }

  async findOne(id: string): Promise<VehicleWithLastUse> {
    const v = await this.vehicleRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    const last = await this.reservationRepo.findOne({
      where: { vehicleId: id, status: 'completed' },
      relations: ['user'],
      order: { endDatetime: 'DESC' },
    });
    const user = last?.user as { displayName?: string; email?: string } | undefined;
    return {
      ...v,
      lastFuelLevel: last?.checkoutFuelLevel ?? null,
      lastUsedByUser: user ? (user.displayName || user.email) || null : null,
    };
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

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

const KM_THRESHOLD = 500;
const DAYS_THRESHOLD = 15;

@Injectable()
export class MaintenanceSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MaintenanceSchedulerService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Maintenance)
    private maintenanceRepo: Repository<Maintenance>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async onApplicationBootstrap() {
    await this.checkUpcomingMaintenance();
  }

  @Cron('0 7 * * *') // todos los días a las 7:00 AM
  async checkUpcomingMaintenance(): Promise<void> {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + DAYS_THRESHOLD);

    const dueVehicles = await this.vehicleRepo
      .createQueryBuilder('v')
      .where('v.deletedAt IS NULL')
      .andWhere(
        '((v.nextServiceOdometer IS NOT NULL AND v.currentOdometer IS NOT NULL AND (v.nextServiceOdometer - v.currentOdometer) <= :kmThreshold)' +
          ' OR (v.nextServiceDate IS NOT NULL AND v.nextServiceDate <= :soonDate))',
        { kmThreshold: KM_THRESHOLD, soonDate },
      )
      .getMany();

    if (dueVehicles.length === 0) return;

    const approvers = await this.usersService.findUsersWithPermission('maintenance', 'delete');

    for (const vehicle of dueVehicles) {
      try {
        const alreadyScheduled = await this.maintenanceRepo.count({
          where: { vehicleId: vehicle.id, status: 'scheduled' },
        });
        if (alreadyScheduled > 0) continue;

        const label = `${vehicle.plate} – ${vehicle.brand} ${vehicle.model}`;
        for (const approver of approvers) {
          await this.notificationsService.notifyUser(
            approver.id,
            'maintenance_due',
            'Mantenimiento próximo',
            `El vehículo ${label} está próximo a requerir mantenimiento preventivo.`,
            '/maintenance',
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to process upcoming maintenance for vehicle ${vehicle.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}

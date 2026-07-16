import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceSchedulerService } from './maintenance-scheduler.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance, Vehicle]),
    VehiclesModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceSchedulerService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}

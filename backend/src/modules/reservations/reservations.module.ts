import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { UsersModule } from '../users/users.module';
import { SanctionsModule } from '../sanctions/sanctions.module';
import { FuelRecordsModule } from '../fuel-records/fuel-records.module';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsSchedulerService } from './reservations-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Vehicle]),
    NotificationsModule,
    SystemSettingsModule,
    UsersModule,
    SanctionsModule,
    FuelRecordsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsSchedulerService],
  exports: [ReservationsService],
})
export class ReservationsModule {}

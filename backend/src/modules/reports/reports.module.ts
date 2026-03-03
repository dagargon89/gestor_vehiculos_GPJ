import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { Incident } from '../../database/entities/incident.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, FuelRecord, Maintenance, Incident])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

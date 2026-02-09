import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

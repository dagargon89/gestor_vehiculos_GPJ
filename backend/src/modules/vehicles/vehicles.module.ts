import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Reservation } from '../../database/entities/reservation.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Reservation]), StorageModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
import { FuelRecordsService } from './fuel-records.service';
import { FuelRecordsController } from './fuel-records.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FuelRecord])],
  controllers: [FuelRecordsController],
  providers: [FuelRecordsService],
  exports: [FuelRecordsService],
})
export class FuelRecordsModule {}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FuelRecordsService } from './fuel-records.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { FuelRecord } from '../../database/entities/fuel-record.entity';

@Controller('fuel-records')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class FuelRecordsController {
  constructor(private fuelRecordsService: FuelRecordsService) {}

  @Get()
  @RequirePermission('fuel_records', 'read')
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.fuelRecordsService.findAll(vehicleId);
  }

  @Get(':id')
  @RequirePermission('fuel_records', 'read')
  findOne(@Param('id') id: string) {
    return this.fuelRecordsService.findOne(id);
  }

  @Post()
  @RequirePermission('fuel_records', 'create')
  create(@Body() body: Partial<FuelRecord>) {
    return this.fuelRecordsService.create(body);
  }

  @Put(':id')
  @RequirePermission('fuel_records', 'update')
  update(@Param('id') id: string, @Body() body: Partial<FuelRecord>) {
    return this.fuelRecordsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('fuel_records', 'delete')
  remove(@Param('id') id: string) {
    return this.fuelRecordsService.remove(id);
  }
}

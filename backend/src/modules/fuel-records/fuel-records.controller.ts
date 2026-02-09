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
import { FuelRecord } from '../../database/entities/fuel-record.entity';

@Controller('fuel-records')
@UseGuards(FirebaseAuthGuard)
export class FuelRecordsController {
  constructor(private fuelRecordsService: FuelRecordsService) {}

  @Get()
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.fuelRecordsService.findAll(vehicleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fuelRecordsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<FuelRecord>) {
    return this.fuelRecordsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<FuelRecord>) {
    return this.fuelRecordsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fuelRecordsService.remove(id);
  }
}

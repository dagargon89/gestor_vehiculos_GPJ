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
import { MaintenanceService } from './maintenance.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { Maintenance } from '../../database/entities/maintenance.entity';

@Controller('maintenance')
@UseGuards(FirebaseAuthGuard)
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get()
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
  ) {
    return this.maintenanceService.findAll(
      vehicleId || status ? { vehicleId, status } : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Maintenance>) {
    return this.maintenanceService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Maintenance>) {
    return this.maintenanceService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}

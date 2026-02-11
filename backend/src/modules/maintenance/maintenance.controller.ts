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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Maintenance } from '../../database/entities/maintenance.entity';

@Controller('maintenance')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get()
  @RequirePermission('maintenance', 'read')
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
  ) {
    return this.maintenanceService.findAll(
      vehicleId || status ? { vehicleId, status } : undefined,
    );
  }

  @Get(':id')
  @RequirePermission('maintenance', 'read')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  @RequirePermission('maintenance', 'create')
  create(@Body() body: Partial<Maintenance>) {
    return this.maintenanceService.create(body);
  }

  @Put(':id')
  @RequirePermission('maintenance', 'update')
  update(@Param('id') id: string, @Body() body: Partial<Maintenance>) {
    return this.maintenanceService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('maintenance', 'delete')
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}

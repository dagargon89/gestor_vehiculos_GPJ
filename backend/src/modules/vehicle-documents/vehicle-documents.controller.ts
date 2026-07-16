import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';

@Controller('vehicle-documents')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class VehicleDocumentsController {
  constructor(private service: VehicleDocumentsService) {}

  @Get()
  @RequirePermission('vehicle_documents', 'read')
  findByVehicle(@Query('vehicleId') vehicleId: string) {
    return this.service.findByVehicle(vehicleId);
  }

  @Post()
  @RequirePermission('vehicle_documents', 'create')
  create(@Body() body: Partial<VehicleDocument>) {
    return this.service.create(body);
  }

  @Put(':id')
  @RequirePermission('vehicle_documents', 'update')
  update(@Param('id') id: string, @Body() body: Partial<VehicleDocument>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('vehicle_documents', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

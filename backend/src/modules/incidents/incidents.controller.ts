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
import { IncidentsService } from './incidents.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Incident } from '../../database/entities/incident.entity';

@Controller('incidents')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Get()
  @RequirePermission('incidents', 'read')
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.incidentsService.findAll(
      vehicleId || userId || status ? { vehicleId, userId, status } : undefined,
    );
  }

  @Get(':id')
  @RequirePermission('incidents', 'read')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  @RequirePermission('incidents', 'create')
  create(@Body() body: Partial<Incident>) {
    return this.incidentsService.create(body);
  }

  @Put(':id')
  @RequirePermission('incidents', 'update')
  update(@Param('id') id: string, @Body() body: Partial<Incident>) {
    return this.incidentsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('incidents', 'delete')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}

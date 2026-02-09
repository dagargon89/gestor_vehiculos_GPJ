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
import { Incident } from '../../database/entities/incident.entity';

@Controller('incidents')
@UseGuards(FirebaseAuthGuard)
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Get()
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
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Incident>) {
    return this.incidentsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Incident>) {
    return this.incidentsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}

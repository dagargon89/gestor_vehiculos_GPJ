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
import { ReservationsService } from './reservations.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('reservations')
@UseGuards(FirebaseAuthGuard)
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.reservationsService.findAll(
      status || vehicleId || userId ? { status, vehicleId, userId } : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.reservationsService.create(body as Parameters<typeof this.reservationsService.create>[0]);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.reservationsService.update(id, body as Parameters<typeof this.reservationsService.update>[1]);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}

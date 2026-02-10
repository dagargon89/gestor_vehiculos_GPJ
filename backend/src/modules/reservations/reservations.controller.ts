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
  InternalServerErrorException,
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
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const hasFilters = status || vehicleId || userId || start || end;
    return this.reservationsService.findAll(
      hasFilters ? { status, vehicleId, userId, start, end } : undefined,
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
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      return await this.reservationsService.update(id, body as Parameters<typeof this.reservationsService.update>[1]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(message);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}

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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('reservations')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Get()
  @RequirePermission('reservations', 'read')
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

  @Post(':id/check-in')
  @RequirePermission('reservations', 'update')
  checkIn(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { odometer: number; fuelPhotoUrl?: string; conditionPhotoUrls?: string[] },
  ) {
    return this.reservationsService.checkIn(
      id,
      user.id,
      body.odometer,
      body.fuelPhotoUrl,
      body.conditionPhotoUrls,
    );
  }

  @Post(':id/check-out')
  @RequirePermission('reservations', 'update')
  checkOut(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { odometer: number; fuelPhotoUrl?: string; fuelLevel?: string; conditionPhotoUrls?: string[] },
  ) {
    return this.reservationsService.checkOut(
      id,
      user.id,
      body.odometer,
      body.fuelPhotoUrl,
      body.conditionPhotoUrls,
      body.fuelLevel,
    );
  }

  @Get('no-checkin')
  @RequirePermission('reservations', 'read')
  findNoCheckIn() {
    return this.reservationsService.findNoCheckIn();
  }

  @Get(':id')
  @RequirePermission('reservations', 'read')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  @RequirePermission('reservations', 'create')
  create(@Body() body: Record<string, unknown>) {
    return this.reservationsService.create(body as Parameters<typeof this.reservationsService.create>[0]);
  }

  @Put(':id')
  @RequirePermission('reservations', 'update')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      return await this.reservationsService.update(id, body as Parameters<typeof this.reservationsService.update>[1]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(message);
    }
  }

  @Delete(':id')
  @RequirePermission('reservations', 'delete')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}

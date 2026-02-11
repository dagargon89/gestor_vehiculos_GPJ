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
import { NotificationsService } from './notifications.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Notification } from '../../database/entities/notification.entity';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @RequirePermission('notifications', 'read')
  findAll(
    @Query('userId') userId?: string,
    @Query('read') read?: string,
  ) {
    const readFilter = read === 'true' ? true : read === 'false' ? false : undefined;
    return this.notificationsService.findAll(userId, readFilter);
  }

  @Get(':id')
  @RequirePermission('notifications', 'read')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Notification>) {
    return this.notificationsService.create(body);
  }

  @Put(':id/read')
  @RequirePermission('notifications', 'update')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put(':id')
  @RequirePermission('notifications', 'update')
  update(@Param('id') id: string, @Body() body: Partial<Notification>) {
    return this.notificationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}

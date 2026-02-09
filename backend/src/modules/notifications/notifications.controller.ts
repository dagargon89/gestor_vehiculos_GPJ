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
import { Notification } from '../../database/entities/notification.entity';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('read') read?: string,
  ) {
    const readFilter = read === 'true' ? true : read === 'false' ? false : undefined;
    return this.notificationsService.findAll(userId, readFilter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Notification>) {
    return this.notificationsService.create(body);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Notification>) {
    return this.notificationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}

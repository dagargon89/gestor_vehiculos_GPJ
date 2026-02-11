import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@Controller('system-settings')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class SystemSettingsController {
  constructor(private systemSettingsService: SystemSettingsService) {}

  @Get()
  @RequirePermission('system_settings', 'read')
  findAll() {
    return this.systemSettingsService.findAll();
  }

  @Get(':id')
  @RequirePermission('system_settings', 'read')
  findOne(@Param('id') id: string) {
    return this.systemSettingsService.findOne(id);
  }

  @Post()
  @RequirePermission('system_settings', 'update')
  create(@Body() body: { key: string; value: string }) {
    return this.systemSettingsService.create(body);
  }

  @Put(':id')
  @RequirePermission('system_settings', 'update')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ key: string; value: string }>,
  ) {
    return this.systemSettingsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('system_settings', 'update')
  remove(@Param('id') id: string) {
    return this.systemSettingsService.remove(id);
  }
}

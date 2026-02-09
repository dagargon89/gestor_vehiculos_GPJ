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

@Controller('system-settings')
@UseGuards(FirebaseAuthGuard)
export class SystemSettingsController {
  constructor(private systemSettingsService: SystemSettingsService) {}

  @Get()
  findAll() {
    return this.systemSettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemSettingsService.findOne(id);
  }

  @Post()
  create(@Body() body: { key: string; value: string }) {
    return this.systemSettingsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ key: string; value: string }>,
  ) {
    return this.systemSettingsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemSettingsService.remove(id);
  }
}

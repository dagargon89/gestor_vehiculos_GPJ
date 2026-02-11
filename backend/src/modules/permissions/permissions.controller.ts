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
import { PermissionsService } from './permissions.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission('permissions', 'read')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermission('permissions', 'read')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Post()
  create(@Body() body: { resource: string; action: string }) {
    return this.permissionsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ resource: string; action: string }>,
  ) {
    return this.permissionsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}

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
import { SanctionsService } from './sanctions.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Sanction } from '../../database/entities/sanction.entity';

@Controller('sanctions')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class SanctionsController {
  constructor(private sanctionsService: SanctionsService) {}

  @Get()
  @RequirePermission('sanctions', 'read')
  findAll(@Query('userId') userId?: string) {
    return this.sanctionsService.findAll(userId);
  }

  @Get(':id')
  @RequirePermission('sanctions', 'read')
  findOne(@Param('id') id: string) {
    return this.sanctionsService.findOne(id);
  }

  @Post()
  @RequirePermission('sanctions', 'create')
  create(@Body() body: Partial<Sanction>) {
    return this.sanctionsService.create(body);
  }

  @Put(':id')
  @RequirePermission('sanctions', 'update')
  update(@Param('id') id: string, @Body() body: Partial<Sanction>) {
    return this.sanctionsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('sanctions', 'delete')
  remove(@Param('id') id: string) {
    return this.sanctionsService.remove(id);
  }
}

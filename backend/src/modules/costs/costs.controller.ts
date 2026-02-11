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
import { CostsService } from './costs.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Cost } from '../../database/entities/cost.entity';

@Controller('costs')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class CostsController {
  constructor(private costsService: CostsService) {}

  @Get()
  @RequirePermission('costs', 'read')
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('category') category?: string,
  ) {
    return this.costsService.findAll(
      vehicleId || category ? { vehicleId, category } : undefined,
    );
  }

  @Get(':id')
  @RequirePermission('costs', 'read')
  findOne(@Param('id') id: string) {
    return this.costsService.findOne(id);
  }

  @Post()
  @RequirePermission('costs', 'create')
  create(@Body() body: Partial<Cost>) {
    return this.costsService.create(body);
  }

  @Put(':id')
  @RequirePermission('costs', 'update')
  update(@Param('id') id: string, @Body() body: Partial<Cost>) {
    return this.costsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('costs', 'delete')
  remove(@Param('id') id: string) {
    return this.costsService.remove(id);
  }
}
